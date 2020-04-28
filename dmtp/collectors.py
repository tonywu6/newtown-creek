# collectors.py - Collect HTML files
# Copyright (C) 2020  Tony Wu <tony[dot]wu[at]nyu[dot]edu>

# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

from pathlib import Path
from urllib.parse import urlparse, urlunparse

import bs4
import simplejson
import requests

from jinja2 import Environment, Template

from . import metadata


class Hyperlink:
    def __init__(self, url, tag=None):
        if not url:
            raise ValueError('No URL supplied')
        self.url = urlparse(url)
        self.tag = tag

    def __str__(self):
        return f'<Hyperlink {urlunparse(self.url)}>'

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


def parse_script_tag(soup: bs4.BeautifulSoup):
    metadata = soup.find('script')
    if metadata:
        return simplejson.loads(metadata.string)
    return dict()


def collect_refs(soup: bs4.BeautifulSoup):
    tags = soup.find_all(Hyperlink.tag_has_link)
    return [Hyperlink(a.get('href', a.get('src')), a) for a in tags]


def get_metadata(env: Environment, template: Template, context: dict = None) -> dict:
    context = context or dict()
    module = template.make_module(context)
    soup = bs4.BeautifulSoup(str(module), 'html.parser')

    md = {
        'title': module.title,
        'short_title': getattr(module, 'short_title', module.title),
        'topic': module.topic,
        'location': getattr(module, 'location', list()),
        'accent': metadata.LINES[metadata.PAGES[module.topic][1]],
    }
    md['refs'] = collect_refs(soup)
    return md


def collect_metadata(env: Environment, tmpls: list, base_md: dict = None, context: dict = None) -> dict:
    base_md = base_md or dict()

    metadata = {**base_md}

    metadata['pages'] = dict()
    for tmpl in tmpls:
        metadata['pages'][tmpl] = get_metadata(env, env.get_template(tmpl), context)

    return metadata


def collect_routes(metadata: dict) -> list:
    routes = [dict(url=k, **v) for k, v in metadata['pages'].items()]
    return routes
