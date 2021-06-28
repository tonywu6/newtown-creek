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

import { format as dtformat } from 'date-fns'

export function slugify(text: string, toStrip: RegExp = /[\W_]+/g) {
    return text.replace(toStrip, ' ').trim().toLowerCase()
}

export function killAllChildren(elem: HTMLElement) {
    while (elem.firstElementChild) elem.removeChild(elem.firstElementChild)
}

export function timeElem(datetime: Date, fmt: string) {
    let time = document.createElement('time')
    time.dateTime = datetime.toISOString()
    time.innerText = dtformat(datetime, fmt)
    return time
}

export var artifactPanel: ArtifactPanel

interface Location {
    id: string
    name?: string
    lat?: number
    long?: number
}

class ArtifactPanel {
    elem: HTMLElement
    view: HTMLElement
    name: HTMLElement
    date: HTMLElement
    location: HTMLElement
    description: HTMLElement

    closeButton: HTMLElement
    returnFocus?: HTMLElement

    constructor(panel: HTMLElement) {
        this.elem = panel
        this.view = panel.querySelector('.artifact-view')!
        this.name = panel.querySelector('.artifact-name')!
        this.date = panel.querySelector('.artifact-datetime')!
        this.location = panel.querySelector('.artifact-location')!
        this.description = panel.querySelector('.artifact-description')!
        this.closeButton = this.elem.querySelector('.close-button')!
        this.closeButton.addEventListener('click', (ev) => {
            ev.preventDefault()
            ev.stopPropagation()
            this.elem.classList.remove('show')
        })
        this.closeButton.addEventListener('focusout', () => {
            if (!this.visible && this.returnFocus) {
                this.returnFocus.focus()
                this.returnFocus.setAttribute('aria-expanded', 'false')
            }
        })
    }

    public setDisplay(artifact: Artifact) {
        killAllChildren(this.view)
        killAllChildren(this.date)
        killAllChildren(this.location)
        this.view.appendChild(artifact.element.cloneNode(true))
        this.name.innerText = artifact.name
        this.date.appendChild(artifact.createTimeElem())
        this.location.appendChild(artifact.createLocationElem())
        this.description.innerHTML = artifact.desc
    }

    public get visible(): boolean {
        return this.elem.classList.contains('show')
    }

    public set visible(value: boolean) {
        if (value) {
            this.elem.classList.add('show')
            this.closeButton.focus()
        } else {
            this.elem.classList.remove('show')
        }
    }
}

export class Artifact {
    element: HTMLElement

    name: string
    desc: string
    date: Date
    location: Location

    constructor(artifact: HTMLElement) {
        this.element = artifact
        this.name = artifact.title!
        this.desc = (artifact as HTMLImageElement).alt || artifact.getAttribute('aria-label') || ''
        this.date = new Date(artifact.dataset.datetime!)
        this.location = { id: artifact.dataset.locationId!, name: artifact.dataset.location! }
    }

    get datetimestr(): string {
        return dtformat(this.date, 'MMM d, y, HH:mm')
    }

    createTimeElem() {
        return timeElem(this.date, 'MMM d, y, HH:mm')
    }

    createLocationElem() {
        let anchor = document.createElement('a')
        anchor.innerText = this.location.name || this.location.id
        return anchor
    }

    createInfoPanelListener(target: ArtifactPanel): (ev: MouseEvent) => void {
        return (ev) => {
            let button = ev.target as HTMLElement
            ev.preventDefault()
            ev.stopPropagation()
            target.setDisplay(this)
            target.visible = true
            target.returnFocus = button
            button.setAttribute('aria-expanded', 'true')
        }
    }
}

export function initArtifactViewListener(elem: HTMLElement) {
    let artifact = new Artifact(elem)
    let infoButton = document.createElement('a')
    infoButton.classList.add('anchor')
    infoButton.setAttribute('aria-label', 'More info')
    infoButton.setAttribute('role', 'button')
    infoButton.setAttribute('aria-expanded', 'false')
    infoButton.href = '#'
    infoButton.innerHTML = '<i class="bi bi-info-circle-fill"></i>'
    infoButton.addEventListener('click', artifact.createInfoPanelListener(artifactPanel))
    elem.parentElement!.appendChild(infoButton)
    elem.parentElement!.classList.add('anchor-container')
}

function initArtifactPanel() {
    artifactPanel = new ArtifactPanel(document.querySelector('.artifact-panel')!)
}

function initArtifacts() {
    let figures = [...document.querySelectorAll('.artifact')] as HTMLElement[]
    for (let figure of figures) {
        initArtifactViewListener(figure)
    }
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
            anchor.setAttribute('aria-label', 'Jump to here')
            anchor.setAttribute('aria-hidden', 'true')
            anchor.innerHTML = '<i class="bi bi-link-45deg"></i>'
            heading.append(anchor)
            heading.classList.add('anchor-container')
        }
    }
}

export function init() {
    createLandmarks()
    initArtifactPanel()
    initArtifacts()
}
