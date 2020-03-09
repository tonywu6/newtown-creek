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

import bs4
import simplejson
from jinja2 import Environment


def parse_script_tag(html_text):
    metadata = bs4.BeautifulSoup(html_text, 'html.parser').find('script')
    if metadata:
        return simplejson.loads(metadata.text)
    return dict()


def collect_metadata(env: Environment, tmpls: list, base_md: dict = None, context: dict = None) -> dict:
    base_md = base_md or dict()
    context = context or dict()

    metadata = {**base_md}

    metadata['pages'] = dict()
    for tmpl in tmpls:
        tmpl_module = env.get_template(tmpl).make_module(context)
        metadata_tag = getattr(tmpl_module, 'metadata', '<script></script>')

        metadata['pages'][tmpl] = parse_script_tag(metadata_tag)

    return metadata


def collect_routes(metadata: dict) -> list:
    routes = [{
        'url': k,
        'name': v.get('name', k),
        'order': 100,
        'decoration': '',
        'hidden': True,
    } for k, v in metadata['pages'].items()]

    for r in routes:
        data = metadata['pages'][r['url']]
        if 'navigation' in data:
            nav = data['navigation']
            r['order'] = nav.get('order', 100)
            r['decoration'] = nav.get('decoration', 'color-white-bg')
            r['hidden'] = nav.get('hidden', False)

    routes = sorted(routes, key=lambda r: r['order'])
    return routes
