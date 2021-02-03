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

import os
import shutil
import subprocess
from pathlib import Path

import click
from ftpsync.targets import FsTarget
from ftpsync.ftp_target import FtpTarget
from ftpsync.synchronizers import UploadSynchronizer

from . import dmtp


@click.group()
def cli():
    pass


@cli.command()
def build():
    dmtp.WebpageBundle().build_site()


@cli.command()
def publish():
    dmtp.WebpageBundle().build_site()
    web = FsTarget('./web')
    remote = FtpTarget('/', os.getenv('FTP_HOST'), username=os.getenv('FTP_USERNAME'), password=os.getenv('FTP_PASSWORD'))
    opts = {"force": False, "delete_unmatched": True, "verbose": 3, 'exclude': '.DS_Store,.git,.hg,.svn', 'resolve': 'ask'}
    s = UploadSynchronizer(web, remote, opts)
    s.run()


@cli.command()
def make_thumbnails():
    shutil.rmtree('static/thumbnails', ignore_errors=True)
    for dirname, _, files in os.walk('static/img'):
        for f in files:
            p = Path(f'{dirname}/{f}')
            rp = p.relative_to('static/img')
            thp = Path('static/thumbnails', rp)
            os.makedirs(thp.parent, exist_ok=True)
            subprocess.run(['ffmpeg', '-i', str(p), '-pix_fmt', 'yuvj444p', '-vf', 'crop=in_h*0.8:in_h*0.8:(in_w-in_h*0.8)/2:in_h*0.1, scale=-1:768', str(thp)])

if __name__ == '__main__':
    cli()
