# assemble.py - Build & publish
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
import warnings
from pathlib import Path

from dotenv import load_dotenv
from ftpsync.targets import FsTarget
from ftpsync.ftp_target import FtpTarget
from ftpsync.synchronizers import UploadSynchronizer

from . import web_env, collectors, logger

load_dotenv()


def build():
    if Path('./web').exists():
        logger.info('Cleaning web folder...')
        shutil.rmtree('./web')
    os.makedirs('./web', exist_ok=True)

    logger.info('Linking scripts and static content...')
    os.symlink(Path('./static').resolve(), Path('./web/static').resolve())
    os.symlink(Path('./src/script').resolve(), Path('./web/script').resolve())

    logger.info('Compiling CSS...')
    subprocess.run(['sass', './src/styles:./web/styles'])

    logger.info('Rendering HTML...')
    pages = web_env.list_templates(filter_func=lambda t: t[-5:] == '.html' and '/' not in t)
    metadata = collectors.collect_metadata(web_env, pages)
    routes = collectors.collect_routes(metadata)

    for template, page in metadata['pages'].items():
        dest = f'./web/{template}'

        for l in page['refs']:
            l: collectors.Hyperlink
            if l.is_local() and not l.exists():
                warnings.warn(ResourceNotFoundWarning(template, l.tag))

        with open(dest, 'w+') as f:
            f.write(
                web_env.get_template(template).render(
                    this=template,
                    title=page['name'],
                    routes=routes,
                ))
            # subprocess.run(['npx', 'js-beautify', '-r', dest])


def publish():
    web = FsTarget('./web')
    remote = FtpTarget('/', os.getenv('FTP_HOST'), username=os.getenv('FTP_USERNAME'), password=os.getenv('FTP_PASSWORD'))
    opts = {"force": False, "delete_unmatched": True, "verbose": 3, 'exclude': '.DS_Store,.git,.hg,.svn'}
    s = UploadSynchronizer(web, remote, opts)
    s.run()


def serve():
    subprocess.run(['npx', 'serve', '-S', './web'])


class ResourceNotFoundWarning(UserWarning):
    def __init__(self, file, tag):
        self.file = file
        self.tag = tag

    def __str__(self):
        return f'{self.tag} in {self.file}'
