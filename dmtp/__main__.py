# __main__.py
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

import click

from . import assemble


@click.group()
def cli():
    pass


@cli.command()
def build():
    assemble.build()


@cli.command()
def serve():
    assemble.build()
    assemble.serve()


@cli.command()
def publish():
    assemble.build()
    assemble.publish()


if __name__ == '__main__':
    cli()
