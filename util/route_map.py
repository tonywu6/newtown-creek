# util/route_map.py
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


import os
from pathlib import Path

import bs4
import simplejson


def traverse(prefix, stack: list):
    for file in os.listdir(prefix):
        node = Path(prefix).joinpath(file)
        if node.is_dir():
            traverse(node, stack)
        else:
            stack.append(node)


def parse(file):
    info = {'url': str(file.relative_to('web'))}
    with open(file) as fp:
        soup = bs4.BeautifulSoup(fp, features="html.parser")

        name = soup.find(itemprop="nav-name")
        hidden = soup.find(itemprop="nav-hidden")
        info['name'] = name and name['content']
        info['hidden'] = hidden and hidden['content']
        info['hidden'] = True if info['hidden'] == 'true' else info['hidden']
        if not name:
            return info

        meta_nav_order = soup.find(itemprop="nav-order")
        meta_nav_decoration = soup.find(itemprop="nav-decoration")
        info['order'] = int(meta_nav_order['content']) if meta_nav_order else 99
        info['decoration'] = meta_nav_decoration and meta_nav_decoration['content']

    return info


def main():
    paths = list()
    traverse('web', paths)
    routes = [parse(k) for k in paths if k.suffix == '.html']

    metadata = {
        'routes': routes
    }
    with open('web/api/metadata.json', 'w+') as f:
        simplejson.dump(metadata, f, sort_keys=True, indent='    ')


if __name__ == '__main__':
    main()
