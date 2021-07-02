# makethumbnails.py
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

import logging
import os
import shutil
import subprocess
from concurrent.futures import Future, ProcessPoolExecutor, as_completed
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Generate thumbnails for images and videos'

    def handle(self, *args, **options):
        from ...models import Multimedia
        log = logging.getLogger('dmtp.thumbnails')

        root: Path = settings.STATIC_SRC_DIR / 'thumbnails'
        try:
            shutil.rmtree(root, ignore_errors=False)
        except FileNotFoundError:
            pass

        with ProcessPoolExecutor(os.cpu_count()) as executor:
            futures: dict[Future, tuple[Path, Path]] = {}
            for media in Multimedia.objects.filter(type__in=['image', 'video']):
                media: Multimedia
                src = media.path
                dst = (root / media.qualified_name).with_suffix('.jpg')
                futures[executor.submit(run_ffmpeg, src, dst, media.type)] = src, dst
            for fut in as_completed(futures):
                src, dst = futures[fut]
                try:
                    fut.result()
                except subprocess.CalledProcessError as e:
                    log.error(f'Error generating thumbnail: {src}\n{e.stderr}')
                else:
                    log.info(f'{src.relative_to(settings.STATIC_SRC_DIR)} '
                             f'-> {dst.relative_to(settings.STATIC_SRC_DIR)}')


def run_ffmpeg(src: Path, dst: Path, media_type: str):
    os.makedirs(dst.parent, exist_ok=True)
    seeking_opts = ['-ss', '10'] if media_type == 'video' else []
    subprocess.run(['ffmpeg', *seeking_opts, '-i', str(src), '-pix_fmt', 'yuvj444p',
                    '-vf', 'crop=in_h*0.6:in_h*0.6:(in_w-in_h*0.6)/2:in_h*0.2,scale=-1:512',
                    '-vframes', '1', str(dst)],
                   capture_output=True, check=True)
