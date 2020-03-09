# util.py - Utilities
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


def kvp2dict(kvpairs: dict, prefix='') -> dict:
    pairs = {k[len(prefix):]: v for k, v in kvpairs.items() if k[:len(prefix)] == prefix}
    props = {k: v for k, v in pairs.items() if '.' not in k}

    parent_paths = {k.split('.')[0] for k in pairs if '.' in k}
    for parent in parent_paths:
        sub_props = kvp2dict(kvpairs, prefix + parent + '.')

        parent_prop = props.get(parent)
        if not isinstance(parent_prop, dict):
            sub_props['__value__'] = parent_prop

        props[parent] = sub_props

    return props
