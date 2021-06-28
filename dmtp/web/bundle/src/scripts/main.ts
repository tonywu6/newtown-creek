// main.ts
// Copyright (C) 2021  Tony Wu +https://github.com/tonywu7/
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

export function slugify(text: string, toStrip: RegExp = /[\W_]+/g) {
    return text.replace(toStrip, ' ').trim().toLowerCase()
}

function createLandmarks() {
    let headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, .landmark')] as HTMLElement[]
    for (let heading of headings) {
        let text = heading.textContent
        if (text) {
            let id = (heading.id = slugify(text).replace(' ', '-'))
            let anchor = document.createElement('a')
            anchor.id = `anchor-${id}`
            anchor.href = `#${id}`
            anchor.classList.add('anchor')
            anchor.setAttribute('aria-hidden', 'true')
            anchor.innerHTML = '<i class="bi bi-link-45deg"></i>'
            heading.append(anchor)
        }
    }
}

export function init() {
    createLandmarks()
}
