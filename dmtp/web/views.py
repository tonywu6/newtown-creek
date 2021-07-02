# views.py
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

from django.http import Http404, HttpRequest, HttpResponse
from django.shortcuts import get_object_or_404, render
from django.utils.safestring import mark_safe

from .models import MediaType, Multimedia

ICONS = [
    mark_safe('<i class="bi bi-newspaper"></i>'),
    mark_safe('<i class="bi bi-image"></i>'),
    mark_safe('<i class="bi bi-volume-up-fill"></i>'),
    mark_safe('<i class="bi bi-film"></i>'),
]


def index(req: HttpRequest) -> HttpResponse:
    return render(req, 'dmtp/index.html', {'media_type': zip(ICONS, MediaType.values)})


def articles(req: HttpRequest, page: str) -> HttpResponse:
    article = get_object_or_404(Multimedia, qualified_name=f'dmtp/pages/{page}.html')
    if article.type != 'text':
        raise Http404()
    return render(req, article.qualified_name, context={'article': article})
