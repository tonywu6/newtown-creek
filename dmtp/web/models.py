# models.py
# Copyright (C) 2020  Tony Wu +https://github.com/tonywu7/
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

from __future__ import annotations

from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.db import models
from django.db.models.query import QuerySet
from django.template import Template, loader
from django.templatetags.static import static
from django.utils.html import escape
from django.utils.text import slugify


class MediaType(models.TextChoices):
    TEXT = 'text', 'Writing'
    IMAGE = 'image', 'Photo'
    AUDIO = 'audio', 'Sound'
    VIDEO = 'video', 'Video'


class Location(models.Model):
    qualified_name: str = models.CharField(max_length=512, unique=True)

    lat: float = models.FloatField()
    long: float = models.FloatField()

    name: str = models.TextField()
    short_name: str = models.TextField()

    parent: Location = models.ForeignKey('Location', on_delete=models.SET_NULL, null=True, blank=True, related_name='children')
    radius: float = models.FloatField(default=0)

    def __str__(self) -> str:
        return self.qualified_name

    @property
    def is_point(self) -> bool:
        return self.radius == 0

    def to_json(self):
        pass


class Multimedia(models.Model):
    qualified_name: str = models.CharField(max_length=512, unique=True)

    name: str = models.TextField()
    type: str = models.CharField(max_length=32, choices=MediaType.choices)
    description: str = models.TextField(blank=True)

    date_created: datetime = models.DateTimeField(verbose_name='date created')
    location: Location = models.ForeignKey(Location, on_delete=models.CASCADE, null=True, blank=True, related_name='media')
    hidden: bool = models.BooleanField(default=False)

    related: QuerySet[Multimedia] = models.ManyToManyField('self', blank=True)

    @property
    def slug(self) -> str:
        return slugify(f'{self.name} {Path(self.qualified_name).with_suffix("").name}')

    @property
    def path(self) -> Path:
        return settings.STATIC_SRC_DIR / self.qualified_name

    @property
    def static(self) -> str:
        return static(self.qualified_name)

    @property
    def thumbnail(self) -> str:
        return static(f'thumbnails/{Path(self.qualified_name).with_suffix(".jpg")}')

    @property
    def alt(self):
        return escape(self.description)

    def get_template(self) -> Template:
        if self.type != 'text':
            raise ValueError(f'No template for {self}')
        return loader.get_template(self.qualified_name)

    def open(self, mode: str = 'r'):
        if self.type == 'text':
            template = self.get_template()
            return open(template.origin.name, mode)
        return open(self.path, mode)

    def __str__(self) -> str:
        return self.qualified_name
