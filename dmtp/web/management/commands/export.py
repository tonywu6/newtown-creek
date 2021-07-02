# export.py
# Copyright (C) 2021  Tony Wu +https://github.com/tonywu7/
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

import fnmatch
import logging
import mimetypes
import os
import shutil
import subprocess
from pathlib import Path

import boto3
from django.conf import settings
from django.core.management.base import BaseCommand
from django.test.client import Client
from django.urls import reverse


class Command(BaseCommand):
    help = 'Export the site as a static website.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--output', action='store', dest='output',
            help='Export destination', default=None,
        )
        parser.add_argument(
            '--upload', action='store', dest='upload',
            help='File types to upload to Amazon S3', default='',
        )
        parser.add_argument(
            '--no-build', action='store_false', dest='build',
            help='Do not build assets', default=True,
        )
        parser.add_argument(
            '--sync', action='store', dest='sync',
            help='rsync to this destination', default=None,
        )

    def handle(self, *args, output: str, upload: str, build: bool, sync: bool, **options):
        from ...models import Multimedia
        log = logging.getLogger('dmtp.export')

        client = Client(HTTP_HOST='localhost')

        routes = ['/']
        for page in Multimedia.objects.filter(type__exact='text'):
            page: Multimedia
            routes.append(reverse('article', kwargs={'page': page.page}))

        root = Path(output)
        os.makedirs(root, exist_ok=False)

        for r in routes:
            res = client.get(r)
            dst = root / Path(r[1:]) / 'index.html'
            os.makedirs(dst.parent, exist_ok=True)
            with open(dst, 'wb+') as f:
                f.write(res.content)
                log.info(f'Rendered article {dst.relative_to(root)}')

        with open(root / '404.html', 'wb+') as f:
            f.write(client.get('/404').content)

        log.info('Copying media')
        dst_static = root / 'static'
        shutil.copytree(settings.STATIC_SRC_DIR, dst_static)

        if build:
            log.info('Building assets')
            subprocess.run([Path(__file__).resolve().with_name('build.sh')],
                           cwd=str(settings.BUNDLE_DIR))
            shutil.copytree(settings.RESOURCE_BUILD_DIR, dst_static, dirs_exist_ok=True)

        s3_client = boto3.client('s3', aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                                 aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY)
        bucket = settings.AWS_STORAGE_BUCKET_NAME
        prefix = settings.AWS_LOCATION

        log.info('Uploading files to S3')
        matches = upload.split(',')
        for dirname, _, files in os.walk(dst_static):
            for f in files:
                if not any(fnmatch.fnmatch(f, p) for p in matches):
                    continue
                file = Path(dirname) / f
                mime, encoding = mimetypes.guess_type(file, strict=True)
                try:
                    log.info(f'Uploading {file}')
                    s3_client.upload_file(
                        str(file), bucket,
                        f'{prefix}/{file.relative_to(dst_static)}',
                        ExtraArgs={'ACL': 'public-read', 'ContentType': mime},
                    )
                except Exception as e:
                    log.error(e)

        if sync:
            log.info('Sync to EC2')
            subprocess.run([Path(__file__).resolve().with_name('sync.sh'), sync], cwd=root)
