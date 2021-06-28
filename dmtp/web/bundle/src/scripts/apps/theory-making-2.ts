// theory-making-2.ts
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

function initActors() {
    document.querySelectorAll('.actor').forEach((e) => {
        let actor = e as HTMLElement
        let frame = actor.querySelector('.img-container') as HTMLElement
        if (!frame) return
        let button = actor.querySelector('button')!
        let context = frame.parentElement!
        button.addEventListener('click', () => {
            frame.classList.add('fade-out')
            button.classList.toggle('color-red-bg')
            if (button.classList.toggle('color-green-bg')) {
                button.textContent = 'Focus'
            } else {
                button.textContent = 'Context'
            }
            setTimeout(() => {
                context.removeChild(frame)
                frame.classList.remove('fade-out')
                frame.classList.toggle('zoomed-in')
                context.appendChild(frame)
            }, 500)
        })
    })
}

export function init() {
    initActors()
}
