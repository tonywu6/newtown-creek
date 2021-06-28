# multimedia.py
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
import mimetypes
from pathlib import Path

from django.contrib.admin import RelatedOnlyFieldListFilter
from django.contrib.admin.decorators import display
from django.template import TemplateDoesNotExist, TemplateSyntaxError, loader
from django.utils.html import format_html

from ....admin_site.models import AdminController
from ...models import Multimedia
from .. import admin_


@admin_.register(Multimedia)
class MultimediaAdmin(AdminController):
    class Meta:
        model = Multimedia

    @property
    def readonly_fields(self):
        return [*super().readonly_fields, 'media_preview']

    @property
    def list_display(self):
        return [*super().list_display, 'is_valid']

    def _list_filters(self):
        return [*super()._list_filters(), ('location', RelatedOnlyFieldListFilter)]

    @display(description='preview')
    def media_preview(self, instance: Multimedia):
        if instance.type == 'text':
            with instance.open() as f:
                textarea = loader.get_template('dmtp/elements/verbatim.html')
                return textarea.render({'content': f.read()})
        elif instance.type:
            return media_preview(instance.path, instance.static)

    @display(description='is valid', boolean=True)
    def is_valid(self, instance: Multimedia) -> bool:
        if instance.type != 'text':
            return None
        try:
            instance.get_template()
            return True
        except TemplateDoesNotExist:
            return None
        except TemplateSyntaxError:
            return False


def media_preview(path: Path, static: str, preload=True):
    VIDEO_HTML = '<video controls><source preload="{preload}" src="{endpoint}"></video>'
    AUDIO_HTML = '<audio controls><source preload="{preload}" src="{endpoint}"></audio>'
    IMAGE_HTML = '<img src="{endpoint}">'
    OBJECT_HTML = '<object type="{mime}" data="{endpoint}">'
    TEMPLATES = {
        'video/*': VIDEO_HTML,
        'audio/*': AUDIO_HTML,
        'image/svg+xml': OBJECT_HTML,
        'image/*': IMAGE_HTML,
        'application/pdf': OBJECT_HTML,
    }
    mime, encoding = mimetypes.guess_type(path, strict=True)
    if not mime:
        raise RuntimeError('File preview unavailable: cannot determine file type')
    template = None
    for supported_mime, tmpl in TEMPLATES.items():
        if fnmatch.fnmatch(mime, supported_mime):
            template = tmpl
            break
    if not template:
        raise ValueError(f'File preview unavailable: unsupported MIME type {mime}')

    return format_html(
        '<div class="admin-file-preview">{}</div>',
        format_html(template, endpoint=static, mime=mime,
                    preload='metadata' if preload else 'none'),
    )
