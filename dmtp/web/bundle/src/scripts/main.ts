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

export let artifactPanel: ArtifactPanel

export interface MapPoint {
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

    closeButton: HTMLAnchorElement
    returnFocus?: HTMLElement

    prevButton: HTMLAnchorElement
    nextButton: HTMLAnchorElement

    media: MediaInfo[] = []
    pos: number = 0

    constructor(panel: HTMLElement) {
        this.elem = panel
        this.view = panel.querySelector('.artifact-view')!
        this.name = panel.querySelector('.artifact-name')!
        this.date = panel.querySelector('.artifact-datetime')!
        this.location = panel.querySelector('.artifact-location')!
        this.description = panel.querySelector('.artifact-description')!
        this.closeButton = this.elem.querySelector('.close-button')!
        this.prevButton = this.elem.querySelector('.nav-prev')!
        this.prevButton.addEventListener('click', this.prev.bind(this))
        this.nextButton = this.elem.querySelector('.nav-next')!
        this.nextButton.addEventListener('click', this.next.bind(this))
        this.elem.addEventListener('click', (ev) => {
            let tagName = (ev.target as HTMLElement).tagName
            if (tagName === 'SECTION' || tagName === 'DIV') {
                this.closeButton.dispatchEvent(new Event('click'))
            }
        })
        this.closeButton.addEventListener('click', (ev) => {
            ev.preventDefault()
            killAllChildren(this.view)
            this.elem.classList.remove('show')
        })
        this.closeButton.addEventListener('focusout', () => {
            if (!this.visible && this.returnFocus) {
                this.returnFocus.focus()
                this.returnFocus.setAttribute('aria-expanded', 'false')
            }
        })
    }

    public next(ev?: Event) {
        ev?.preventDefault()
        let idx = this.pos + 1
        if (idx >= this.media.length) return
        return this.setDisplay(idx)
    }

    public prev(ev?: Event) {
        ev?.preventDefault()
        let idx = this.pos - 1
        if (idx < 0) return
        return this.setDisplay(idx)
    }

    public setDisplay(idx: number) {
        let artifact = this.media[idx]
        killAllChildren(this.view)
        killAllChildren(this.date)
        killAllChildren(this.location)
        this.view.appendChild(artifact.element.cloneNode(true))
        this.name.innerText = artifact.name
        this.date.appendChild(artifact.createTimeElem())
        this.location.appendChild(artifact.createLocationElem())
        this.description.innerHTML = artifact.desc
        this.pos = idx
        let noPrev = this.pos == 0
        let noNext = this.pos == this.media.length - 1
        this.prevButton.classList.toggle('disabled', noPrev)
        this.prevButton.setAttribute('aria-disabled', noPrev.toString())
        this.nextButton.classList.toggle('disabled', noNext)
        this.nextButton.setAttribute('aria-disabled', noNext.toString())
    }

    public populate(media: MediaInfo[]) {
        this.media = [...media]
        this.pos = 0
    }

    public get visible(): boolean {
        return this.elem.classList.contains('show')
    }

    public set visible(value: boolean) {
        if (value) {
            this.elem.classList.add('show')
            setTimeout(() => this.closeButton.focus(), 100)
        } else {
            this.elem.classList.remove('show')
        }
    }
}

export interface Info {
    id: string
    name: string
}

export interface MediaInfo extends Info {
    element: HTMLElement
    desc: string
    date: Date

    createTimeElem: () => HTMLElement
    createLocationElem: () => HTMLElement
}

export class Artifact implements MediaInfo {
    element: HTMLElement

    id: string
    name: string
    desc: string
    date: Date
    location: MapPoint

    constructor(artifact: HTMLElement) {
        this.id = artifact.dataset.qualname!
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
        anchor.href = `/#${this.location.id}`
        return anchor
    }
}

function initArtifactPanel() {
    artifactPanel = new ArtifactPanel(document.querySelector('.artifact-panel')!)
}

function initArtifacts() {
    let figures = [...document.querySelectorAll('.artifact')] as HTMLElement[]
    let artifacts: Artifact[] = []
    for (let i = 0; i < figures.length; i++) {
        let elem = figures[i]
        let artifact = new Artifact(elem)
        let infoButton = document.createElement('a')
        infoButton.classList.add('anchor')
        infoButton.setAttribute('aria-label', 'More info')
        infoButton.setAttribute('role', 'button')
        infoButton.setAttribute('aria-expanded', 'false')
        infoButton.href = '#'
        infoButton.innerHTML = '<i class="bi bi-info-circle-fill"></i>'
        infoButton.addEventListener('click', (ev) => {
            let button = ev.target as HTMLElement
            ev.preventDefault()
            artifactPanel.setDisplay(i)
            artifactPanel.visible = true
            artifactPanel.returnFocus = button
            button.setAttribute('aria-expanded', 'true')
        })
        elem.parentElement!.appendChild(infoButton)
        elem.parentElement!.classList.add('anchor-container')
        artifacts.push(artifact)
    }
    artifactPanel.populate(artifacts)
}

function createLandmarks() {
    let headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, .landmark')] as HTMLElement[]
    for (let heading of headings) {
        if (heading.classList.contains('no-landmark')) continue
        let text = heading.textContent
        if (text) {
            let id = (heading.id = slugify(text).replace(/ /g, '-'))
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
