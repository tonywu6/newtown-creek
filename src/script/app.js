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
    toggleHidden($('#top-menu-background'))
    toggleHidden($('#top-menu-scrollrect'))
    $('body').toggleClass('noscroll')
    $('#nav-switch img').toggleClass('rotate-45')
}

function toggleHidden(e) {
    $(e).toggleClass('hidden')
    return !$(e).hasClass('hidden')   
}

// function toggleFlex(e) {
//     $(e).toggleClass('flex')
//     return toggleHidden(e)
// }

$(document).ready(() => {
    window.onhashchange = () => {
        if (window.location.hash == '#top-menu-content') toggleMenu()
    }
    window.onhashchange()
})
