import logging
import os
import shutil
import subprocess
import warnings
from pathlib import Path
from urllib.parse import urlparse, urlunparse

import bs4
import simplejson
import requests

from jinja2 import Environment, Template, PackageLoader, select_autoescape

from . import data, logger, TOOL_AVAILABLE


class Hyperlink:
    def __init__(self, url, tag=None):
        if not url:
            raise ValueError('No URL supplied')
        self.url = urlparse(url)
        self.tag = tag

    def __str__(self):
        return f'<Hyperlink {urlunparse(self.url)}>'

    # def __eq__(self, other):
    #     return other.__class__ == self.__class__ and other.url == self.url

    # def __hash__(self):
    #     return hash(self.__class__) + hash(self.url)

    # def __setattr__(self, name, value):
    #     if name == 'url' and not hasattr(self, 'url'):
    #         return object.__setattr__(self, 'url', value)
    #     return super().__setattr__(name, value)

    def is_local(self):
        return not self.url.scheme

    def is_http(self):
        return self.is_local() or self.url.scheme in {'http', 'https'}

    def exists(self):
        if self.is_local():
            return Path('web', self.url.path).exists()
        elif self.is_http():
            return requests.head(urlunparse(self.url)).status_code < 399
        else:
            return True

    @classmethod
    def tag_has_link(cls, tag: bs4.Tag):
        return tag.has_attr('src') or tag.has_attr('href')

    @classmethod
    def collect_refs(cls, soup: bs4.BeautifulSoup):
        tags = soup.find_all(Hyperlink.tag_has_link)
        return [cls(a.get('href', a.get('src')), a) for a in tags]


class Webpage:
    def __init__(self, url, template: Template, context: dict = None):
        self.template = template
        module = template.make_module(context)
        self._soup = bs4.BeautifulSoup(str(module), 'html.parser')

        self.url = url
        self.title = module.title
        self.title_short = getattr(module, 'title_short', self.title)
        self.topic = module.topic
        self.location = getattr(module, 'location', list())
        self.bullet = module.bullet
        self.refs = Hyperlink.collect_refs(self._soup)

        self.primary_page = getattr(module, 'primary_page', False)
        self.context_locals: dict = {k: v for k, v in module.__dict__.items() if k[0] != '_'}

    @property
    def section(self):
        return self.topic.split('.')[0]

    def nav_info(self):
        url_hash = data.COMMONS_BULLET_URL_HASH[self.bullet]
        return {
            'bullet': self.bullet,
            'bullet_url': f'https://upload.wikimedia.org/wikipedia/commons/{url_hash[0]}/{url_hash}/NYCS-bull-trans-{self.bullet}-Std.svg',
            'url': self.url,
            'title': self.title,
            'title_short': self.title_short
        }


class WebpageBundle:
    def __init__(self):
        self.web_env = Environment(
            loader=PackageLoader('dmtp', 'web'),
            autoescape=select_autoescape(['html']),
            trim_blocks=True,
            lstrip_blocks=True,
        )
        self.pages = dict()
        self.find_pages(self.web_env.list_templates(filter_func=lambda t: t[-5:] == '.html' and '/' not in t))

    def find_pages(self, tmpls: list, base_md: dict = None, context: dict = None):
        base_md = base_md or dict()

        for tmpl in tmpls:
            template: Template = self.web_env.get_template(tmpl)
            context = context or dict()
            webpage = Webpage(tmpl, template, context)
            self.pages[webpage.topic] = webpage

    def make_route_mapping(self):
        tree = dict()

        for topic, page in self.pages.items():
            page: Webpage
            section = tree.setdefault(page.section, {
                'name': page.section,
                'default': None,
                'priority': False,
                'bullets': list()
            })

            if 'section_name' in page.context_locals:
                section['name'] = page.context_locals['section_name']
            if page.primary_page:
                section['default'] = page.url
                section['priority'] = page.primary_page

            section['bullets'].append(page.nav_info())

        for section in tree.values():
            section['bullets'] = sorted(section['bullets'], key=lambda b: b['bullet'] + '  ' + b['url'])

        return tree

    def make_route_list_from_mapping(self, tree):
        return sorted([v for v in tree.values() if v['priority']], key=lambda s: s['priority'])

    def build_site(self):
        if Path('./web').exists():
            logger.info('Cleaning web folder...')
            shutil.rmtree('./web')
        os.makedirs('./web', exist_ok=True)

        logger.info('Linking scripts and static content...')
        os.symlink(Path('./static').resolve(), Path('./web/static').resolve())
        os.symlink(Path('./src/script').resolve(), Path('./web/script').resolve())

        logger.info('Compiling CSS...')
        if TOOL_AVAILABLE['sass']:
            subprocess.run(['sass', './src/styles:./web/styles'])

        logger.info('Rendering HTML...')
        routes_mapping = self.make_route_mapping()
        routes = self.make_route_list_from_mapping(routes_mapping)

        for page in self.pages.values():
            page: Webpage
            dest = f'./web/{page.url}'

            for l in page.refs:
                l: Hyperlink
                if l.is_local() and not l.exists():
                    warnings.warn(ResourceNotFoundWarning(page.url, l.tag))

            with open(dest, 'w+') as f:
                f.write(
                    page.template.render(
                        routes=routes,
                        section=routes_mapping[page.section]
                    ))
                if TOOL_AVAILABLE['npx']:
                    logging.getLogger('npx.js-beautify').info(subprocess.run(['npx', 'js-beautify', '-r', dest], stdout=subprocess.PIPE).stdout.decode('utf8')[:-1])


class ResourceNotFoundWarning(UserWarning):
    def __init__(self, file, tag):
        self.file = file
        self.tag = tag

    def __str__(self):
        return f'{self.tag} in {self.file}'
