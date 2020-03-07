/*
    web/script/app-theory-making-2.js
    Copyright (C) 2020  Tony Wu <tony[dot]wu[at]nyu[dot]edu>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { isMobile } from './util.js'

export function zoom(element) {
    var actor = $(element).siblings('figure').children('.actor-container')
    if (actor.length < 1) return

    actor = actor[0]
    $(actor).toggleClass('zoomed-in')
    actor.offsetWidth;

    if ($(actor).hasClass('zoomed-in')) {
        $(element).children('a').text('Context')
        $(element).addClass('color-red-bg')
        $(element).removeClass('color-green-bg')

        actor.offsetWidth
    } else {
        $(element).children('a').text('Focus')
        $(element).removeClass('color-red-bg')
        $(element).addClass('color-green-bg')

        actor.offsetWidth
    }
}

(() => {
    if (isMobile()) {
        $('.actor-container-frame').css('border-radius', 0)
    }
})()

window.zoom = zoom