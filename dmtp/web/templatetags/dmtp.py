# dmtp.py
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

from dataclasses import dataclass

from django.template import Context, Library, Node, loader

from ...utils.template import (create_tag_parser, domtokenlist, optional_attr,
                               unwrap)
from ..models import Multimedia

register = Library()


@create_tag_parser(register, 'artifact')
@dataclass
class ArtifactNode(Node):
    resource: str
    id: str = ''
    classes: str = ''

    def get_instance(self, ctx: Context) -> Multimedia:
        return Multimedia.objects.prefetch_related('location').get(qualified_name=unwrap(ctx, self.resource))

    def render(self, ctx: Context):
        id_ = optional_attr('id', unwrap(ctx, self.id))
        classes = optional_attr('class', domtokenlist('artifact', unwrap(ctx, self.classes)))

        instance = self.get_instance(ctx)
        template = loader.get_template(f'dmtp/elements/artifact/{instance.type}.html')
        info = {'id': id_, 'classes': classes, 'static': instance.static,
                'name': instance.name, 'description': instance.alt,
                'datetime': instance.date_created.isoformat(),
                'location_id': instance.location.qualified_name,
                'location': instance.location.name}
        return template.render(info)


@create_tag_parser(register, 'figure')
@dataclass
class FigureNode(Node):
    resource: str
    id: str = ''
    classes: str = ''
    caption: str = ''

    def render(self, ctx: Context):
        artifact = ArtifactNode(self.resource, self.id, self.classes)
        return loader.get_template('dmtp/elements/figure.html').render(
            {'artifact': artifact.render(ctx),
             'caption': unwrap(ctx, self.caption)},
        )


@create_tag_parser(register, 'actor')
@dataclass
class ActorNode(Node):
    resource: str
    id: str
    caption: str = ''

    def render(self, ctx: Context):
        img = ArtifactNode(self.resource)
        return loader.get_template('dmtp/elements/actor.html').render({
            'img': img.render(ctx),
            'id': unwrap(ctx, self.id),
            'caption': unwrap(ctx, self.caption),
        })
