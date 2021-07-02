# schema.py
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

from django.urls import reverse
from graphene import List, ObjectType, String
from graphene_django import DjangoObjectType

from .models import Location, Multimedia


class LocationType(DjangoObjectType):
    class Meta:
        model = Location


class MultimediaType(DjangoObjectType):
    url = String()
    thumb = String()
    slug = String()

    class Meta:
        model = Multimedia
        convert_choices_to_enum = False

    def resolve_url(self, info):
        if self.type == 'text':
            return reverse('article', kwargs={
                'page': (self.qualified_name
                         .replace('dmtp/pages/', '')
                         .replace('.html', '')),
            })
        return self.static

    def resolve_thumb(self, info):
        if self.type == 'text' or self.type == 'audio':
            return None
        return self.thumbnail

    def resolve_slug(self, info):
        return self.slug


class Query(ObjectType):
    locations = List(LocationType)
    multimedia = List(MultimediaType)

    def resolve_locations(root, info):
        return Location.objects.filter(parent__isnull=True)

    def resolve_multimedia(root, info):
        return Multimedia.objects.filter(hidden__exact=False)
