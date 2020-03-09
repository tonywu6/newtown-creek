/*
    web/script/app.js
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


function toggleMenu() {
    toggleFlex($('#top-menu-content'))
    $('#nav-switch img').toggleClass('rotate-45')
}
function toggleFlex(e) {
    $(e).toggleClass('hidden')
    $(e).toggleClass('flex')
    return !$(e).hasClass('hidden')
}

$(document).ready(() => {
    $('#nav-switch').on('click', toggleMenu)
    if (window.location.hash == '#top-menu-content') toggleMenu()
})
