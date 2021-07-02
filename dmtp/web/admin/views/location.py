# location.py
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

from django.contrib.admin.decorators import display
from django.db.models import BooleanField, ExpressionWrapper, Q

from ....admin_site.models import AdminController
from ...models import Location
from .. import admin_


@admin_.register(Location)
class LocationAdmin(AdminController):
    class Meta:
        model = Location

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            has_parent=ExpressionWrapper(
                Q(parent__isnull=False), BooleanField(),
            ),
        )

    @property
    def list_display(self):
        return [*super().list_display, 'has_parent']

    @display(boolean=True)
    def has_parent(self, instance: Location):
        return instance.has_parent
