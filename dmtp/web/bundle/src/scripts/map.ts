// map.ts
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

import { compareAsc as dateCompareAsc } from 'date-fns'

import * as d3 from 'd3'
import * as _ from 'lodash'
import { ApolloClient, gql, InMemoryCache, HttpLink, from as linkFrom, ApolloQueryResult } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'

import { artifactPanel, MediaInfo, timeElem } from './main'

const GET_DATA = gql`
    query {
        locations {
            qualifiedName
            lat
            long
            radius
            name
            shortName
            children {
                qualifiedName
                lat
                long
                radius
                name
                shortName
            }
        }
        multimedia {
            qualifiedName
            slug
            url
            thumb
            name
            type
            description
            dateCreated
            location {
                qualifiedName
            }
        }
    }
`

function getCSRF(elem: HTMLElement) {
    let csrf = elem.querySelector<HTMLInputElement>('input[type="hidden"][name="csrfmiddlewaretoken"]')
    if (!csrf) {
        throw new Error(`No CSRF token found for form ${elem}`)
    }
    return csrf.value
}

const setCSRFToken = setContext((request, previousContext) => ({
    headers: { 'X-CSRFToken': getCSRF(document.documentElement) },
}))

const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: linkFrom([setCSRFToken, new HttpLink({ uri: '/graphql' })]),
})

const locations: Record<string, Location> = {}
const multimedia: Record<string, Multimedia> = {}

const VIEWPORT_NW = 'queens-midtown-tunnel'
const VIEWPORT_SE = 'seneca-bleecker'

type Coord = [number, number]
type Dimension = Coord

type LocationType = {
    qualifiedName: string
    lat: number
    long: number
    radius: number
    name: string
    shortName: string
    children?: LocationType[]
}

type MediaType = 'text' | 'image' | 'video' | 'audio'

interface MultimediaType {
    qualifiedName: string
    slug: string
    url: string
    thumb?: string
    name: string
    type: MediaType
    description: string
    dateCreated: string
    location: LocationType
}

type Query = {
    locations: LocationType[]
    multimedia: MultimediaType[]
}

class Location {
    id: string
    lat: number
    long: number
    radius: number
    name: string
    shortName: string

    parent?: Location
    children: Location[] = []

    constructor(data: LocationType, parent?: Location) {
        this.id = data.qualifiedName
        this.lat = data.lat
        this.long = data.long
        this.radius = data.radius
        this.name = data.name
        this.shortName = data.shortName
        this.parent = parent
        if (data.children) {
            this.children.push(...data.children.map((d) => new Location(d, this)))
        }
    }

    get coord(): Coord {
        let NW = locations[VIEWPORT_NW]
        let SE = locations[VIEWPORT_SE]
        return clampCoord([this.long, this.lat], [NW.long, SE.lat], [SE.long, NW.lat])
    }

    toFeature(): GeoJSON.Feature {
        return {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: this.coord },
            properties: {
                id: this.id,
                name: this.name,
                radius: this.radius,
            },
        }
    }

    toCollection(): GeoJSON.FeatureCollection {
        return {
            type: 'FeatureCollection',
            features: this.children.map((loc) => loc.toFeature()),
        }
    }

    get media(): Multimedia[] {
        return _.flatten([
            Object.values(multimedia).filter((m) => Object.is(m.location, this)),
            ...this.children.map((loc) => loc.media),
        ])
    }

    get isGroup(): boolean {
        return Boolean(this.children.length)
    }

    get isPoint(): boolean {
        return this.radius == 0
    }

    get isHidden(): boolean {
        return this.isPoint && this.isGroup
    }

    get isOutOfBound(): boolean {
        let [x0, y0] = this.coord
        return this.long != x0 || this.lat != y0
    }

    static comparator(a: Location, b: Location): number {
        let ca = a.coord
        let cb = b.coord
        return -(ca[0] - cb[0]) || ca[1] - cb[1]
    }

    static formatSelector(id: string) {
        return `g#loc-${id}`
    }

    get selector(): string {
        return `g#loc-${this.id}`
    }

    get groupSelector(): string {
        return `g#group-${this.id}`
    }
}

class Multimedia implements MediaInfo {
    id: string
    slug: string
    url: string
    thumb?: string
    name: string
    type: MediaType
    desc: string
    date: Date
    location: Location

    constructor(data: MultimediaType) {
        this.id = data.qualifiedName
        this.slug = data.slug
        this.url = data.url
        this.thumb = data.thumb
        this.name = data.name
        this.type = data.type
        this.desc = data.description
        this.date = new Date(data.dateCreated)
        this.location = locations[data.location.qualifiedName]
    }

    get element(): HTMLElement {
        if (this.type === 'text') {
            throw new Error('Constructing a representation HTMLElement for text media is unsupported')
        } else if (this.type === 'image') {
            let img = document.createElement('img')
            img.src = this.url
            img.title = this.name
            img.alt = this.desc
            return img
        } else {
            let media = document.createElement(this.type)
            media.controls = true
            media.title = this.name
            media.setAttribute('aria-label', this.desc)
            let source = document.createElement('source')
            source.src = this.url
            media.append(source)
            return media
        }
    }

    get accessor(): string {
        if (this.type === 'text') return this.url
        return '#'
    }

    createTimeElem(): HTMLElement {
        return timeElem(this.date, 'MMM d, y, HH:mm')
    }

    createLocationElem(): HTMLElement {
        let anchor = document.createElement('a')
        anchor.innerText = this.location.name
        anchor.href = `#${this.location.id}`
        return anchor
    }
}

async function initData() {
    let data: ApolloQueryResult<Query> = await client.query({ query: GET_DATA })
    for (let d of data.data.locations) {
        let loc = new Location(d)
        locations[loc.id] = loc
        for (let subloc of loc.children) locations[subloc.id] = subloc
    }
    for (let d of data.data.multimedia) {
        let media = new Multimedia(d)
        multimedia[media.slug] = media
    }
}

function clampCoord(p: Coord, northwest: Coord, southeast: Coord): Coord {
    let [x0, y0] = northwest
    let [x1, y1] = southeast
    return [_.clamp(p[0], x0, x1), _.clamp(p[1], y0, y1)]
}

function meterToPoints(projection: d3.GeoProjection, origin: Coord, distance: number): number {
    let dest: Coord = [origin[0] + distance / 30.8 / 3600, origin[1]]
    let [x0, y0] = projection(origin)!
    let [x1, y1] = projection(dest)!
    return Math.sqrt((x0 - x1) ** 2 + (y0 - y1) ** 2)
}

function sleep(ms?: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function asyncAnimFrame(): Promise<void> {
    return new Promise((resolve) => window.requestAnimationFrame(() => resolve()))
}

function initMap() {
    let svg: d3.Selection<SVGElement, unknown, HTMLElement, any> = d3.select('#map')
    let [x0, y0, x1, y1] = svg.attr('viewBox').split(' ').map(Number)
    let size: [number, number] = [x1 - x0, y1 - y0]

    let northwest = locations[VIEWPORT_NW]
    let southeast = locations[VIEWPORT_SE]
    let extent: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [northwest.toFeature(), southeast.toFeature()],
    }
    let projection = d3.geoMercator().fitSize(size, extent)

    let addLabel = function (elem: SVGGElement, d: Location, padding: [number, number], scale: number) {
        let g = d3.select(elem)
        d3.select<SVGGElement, null>(elem.parentNode as SVGGElement)
            .selectAll<SVGGElement, Location>('g')
            .filter((d_) => !Object.is(d, d_))
            .lower()
        let gBox = g.node()!.getBBox()
        let label = g
            .append('g')
            .attr('class', 'label')
            .attr(
                'transform',
                `translate(${gBox.x + gBox.width / 2},
                        ${gBox.y + gBox.height / 2})
                        scale(${scale})`
            )
        let text = label
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('aria-hidden', 'true')
            .text(d.shortName)
        let box = text.node()!.getBBox()
        label
            .insert('rect', 'text')
            .attr('x', box.x - padding[0] / 2)
            .attr('y', box.y - padding[1] / 2)
            .attr('width', box.width + padding[0])
            .attr('height', box.height + padding[1])
    }

    let removeLabel = function () {
        root.select('.label').remove()
    }

    let zoom = d3
        .zoom<SVGElement, unknown>()
        .scaleExtent([1, 8])
        .on('zoom', (ev: d3.D3ZoomEvent<SVGElement, any>, d) => {
            root.attr('transform', ev.transform.toString())
        })

    svg.call(zoom)
        .on('dblclick.zoom', null)
        .on('wheel.zoom', null)
        .on('mousedown.zoom', null)
        .on('touchstart.zoom', null)
        .on('touchmove.zoom', null)
        .on('touchend.zoom', null)

    type SVGSelection = d3.Selection<SVGElement, unknown, d3.BaseType, any>
    type SVGElemSelection<T> = d3.Selection<SVGGraphicsElement, T, d3.BaseType, any>
    type SVGGroupSelection<T> = d3.Selection<SVGGElement, T, d3.BaseType, any>

    type ZoomFitOption<T extends SVGGraphicsElement> = {
        root: SVGSelection
        padding: Dimension
        getBound: () => [Coord, Coord]
        getTarget: () => Coord
        getSelection: (d: Location) => d3.Selection<T, any, d3.BaseType, any>
    }

    let zoomFit = <T extends SVGGraphicsElement>(
        options: ZoomFitOption<T>,
        doZoom: (doTransform: () => Promise<void>) => Promise<void>
    ) => {
        return async (d: Location, maxScale: number = 4) => {
            let g = options.getSelection(d)
            let box = g.node()!.getBBox()!
            let bound = options.getBound()
            let [x0, y0] = bound[0]
            let [x1, y1] = bound[1]
            let container: Dimension = [x1 - x0, y1 - y0]
            let [vw, vh] = container
            let origin: Coord = [x0 + vw / 2, y0 + vh / 2]
            let center: Coord = [box.x - options.padding[0], box.y - options.padding[1]]
            let selection: Dimension = [box.width + options.padding[0] * 2, box.height + options.padding[1] * 2]
            let scaleH: number = vw / selection[0]
            let scaleW: number = vh / selection[1]
            let fitW: Dimension = [vw, selection[1] * scaleH]
            let scale: number = _.clamp(fitW[1] > vh ? scaleW : scaleH, 1, maxScale)
            let target = options.getTarget()
            let offset: Coord = [target[0] - vw / 2, target[1] - vh / 2]
            let tx = -center[0] * scale + origin[0] + offset[0] - (selection[0] * scale) / 2
            let ty = -center[1] * scale + origin[1] + offset[1] - (selection[1] * scale) / 2
            await doZoom(() =>
                options.root
                    .transition()
                    .duration(0)
                    .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale))
                    .end()
            )
        }
    }

    let zoomTransition = async (doTransform: () => Promise<void>) => {
        let elem = svg.node()!
        await asyncAnimFrame()
        elem.classList.add('in-transit')
        await sleep(500)
        await asyncAnimFrame()
        await doTransform()
        await sleep(100)
        await asyncAnimFrame()
        elem.classList.remove('in-transit')
    }

    let sidebarConservedBoundingBox = (): [Coord, Coord] => {
        let vw = window.innerWidth
        if (vw > 1024) {
            return [[480, 0], size]
        } else if (vw > 768) {
            return [[360, 0], size]
        } else {
            return [[0, 0], size]
        }
    }

    let zoomToLocation = zoomFit(
        {
            root: svg,
            padding: [90, 60],
            getBound: sidebarConservedBoundingBox,
            getTarget: () => [size[0] / 2, size[1] / 2],
            getSelection: (d): SVGGroupSelection<Location> => {
                if (d.isGroup) {
                    return d3.select(d.groupSelector)
                } else {
                    return d3.select(d.selector)
                }
            },
        },
        zoomTransition
    )

    let detailPanel = d3.select('#overlay')

    function setCurrentLocation(loc: Location | null) {
        window.location.hash = loc ? loc.id : ''
    }

    function getCurrentLocation(): Location | null {
        let locationId = window.location.hash.substr(1)
        let selection: SVGGroupSelection<Location>
        try {
            selection = d3.select(Location.formatSelector(locationId))
        } catch (e) {
            return null
        }
        if (!selection.size()) {
            return null
        }
        return selection.datum()
    }

    function getCurrentMedia(): Multimedia | null {
        let mediaSlug = window.location.hash.substr(1)
        return multimedia[mediaSlug]
    }

    function setMediaList(loc: Location) {
        let pluralize = (s: MediaType, count: number): string => {
            switch (s) {
                case 'text':
                    return count > 1 ? 'articles' : 'article'
                case 'image':
                    return count > 1 ? 'photos' : 'photo'
                case 'audio':
                    return count > 1 ? 'sounds' : 'sound'
                case 'video':
                    return count > 1 ? 'videos' : 'video'
            }
        }
        let media = _.groupBy(loc.media, (m) => m.type)
        let types: MediaType[] = ['text', 'image', 'audio', 'video']
        for (let k of types) {
            let section = d3.select(`#artifacts-${k}`)
            let category = media[k] || []
            let numItems = category.length
            if (numItems) {
                section.style('display', 'block')
            } else {
                section.style('display', 'none')
            }
            section.select('.accordion-button-label').text(`${numItems} ${pluralize(k, numItems)}`)
        }

        let appendTextualItems = (media: Multimedia[], selector: string, itemClass: string) => {
            let container = d3.select<HTMLUListElement, null>(`${selector} .accordion-body`)
            let items = container.selectAll<HTMLLIElement, Multimedia>('li').data(media, (d) => d.id)
            let entry = items.enter().append('li').attr('class', itemClass)
            let links = entry.append('a').attr('title', (d) => d.name)
            links.append('h3').attr('class', 'media-title')
            links.append('p').attr('class', 'media-description')
            items.exit().remove()
            items = items.merge(entry)
            items
                .select<HTMLAnchorElement>('a')
                .attr('href', (d) => d.accessor)
                .select('h3')
                .text((d) => d.name)
            items.select('p').text((d) => d.desc)
            items.sort((a, b) => dateCompareAsc(a.date, b.date))
            return items
        }

        let appendVisualItems = (media: Multimedia[], selector: string, itemClass: string) => {
            let container = d3.select<HTMLUListElement, null>(`${selector} .accordion-body`)
            let items = container.selectAll<HTMLLIElement, Multimedia>('li').data(media, (d) => d.id)
            let entry = items.enter().append('li').attr('class', itemClass)
            let links = entry.append('a').attr('title', (d) => d.name)
            links.append('img')
            items.exit().remove()
            items = items.merge(entry)
            items
                .select<HTMLAnchorElement>('a')
                .attr('href', (d) => d.accessor)
                .select('img')
                .attr('alt', (d) => d.name)
                .attr('src', (d) => d.thumb!)
            items.sort((a, b) => dateCompareAsc(a.date, b.date))
            return items
        }

        appendTextualItems(media.text || [], '#artifacts-text', 'media-text')
        appendTextualItems(media.audio || [], '#artifacts-audio', 'media-audio')
        appendVisualItems(media.image || [], '#artifacts-image', 'media-image')
        appendVisualItems(media.video || [], '#artifacts-video', 'media-video')

        let useArtifactPanel = d3
            .selectAll<HTMLAnchorElement, Multimedia>('.media-audio a, .media-image a, .media-video a')
            .each(function (datum, index) {
                d3.select(this).on('click', function (ev: MouseEvent, d) {
                    ev.preventDefault()
                    artifactPanel.setDisplay(index)
                    artifactPanel.returnFocus = this
                    artifactPanel.visible = true
                })
            })
        artifactPanel.populate(useArtifactPanel.data())
    }

    async function setDetails(loc: Location | null) {
        if (!loc) {
            detailPanel.attr('class', 'rendered')
            await sleep(600)
            detailPanel.attr('class', '')
            return
        }
        let title = detailPanel.select('.map-location-title')
        let backButton = detailPanel.select('.map-location-back')
        let subtitle = detailPanel.select('.map-location-subtitle')
        detailPanel.attr('class', 'rendered')
        await sleep(600)
        title.text(loc.name)
        if (loc.isGroup || loc.isOutOfBound) {
            backButton.attr('href', '#')
            subtitle.text('Full map').attr('aria-label', 'Return to full map')
        } else {
            backButton
                .attr('href', `#${loc.parent!.id}`)
                .attr('aria-label', `Return to region: ${loc.parent!.shortName}`)
            subtitle.text(loc.parent!.shortName)
        }
        setMediaList(loc)
        detailPanel.attr('class', 'rendered show')
    }

    async function setTabIndex() {
        d3.selectAll('.locality').attr('tabindex', '-1')
        let focused = d3.select('.minor-locations.focused')
        let selection: SVGElemSelection<Location>
        if (focused.size()) {
            selection = focused.selectAll<SVGGElement, Location>('.locality')
        } else {
            selection = d3.selectAll<SVGGElement, Location>('.major-locations .locality, .locality.out-of-bound')
        }
        selection
            .data()
            .sort((a, b) => -Location.comparator(a, b))
            .map<[string, number]>((d, i) => [d.selector, i])
            .forEach(([selector, idx]) => d3.select(selector).attr('tabindex', idx + 1))
    }

    async function resetFocus() {
        let transition = zoomTransition(() => svg.transition().duration(0).call(zoom.transform, d3.zoomIdentity).end())
        let resetHighlights = async () => {
            await sleep(500)
            svg.node()!.classList.remove('zoom')
            root.selectAll<SVGGElement, any>('.focused').each(function () {
                this.classList.remove('focused')
            })
            root.selectAll('[aria-expanded="true"]').attr('aria-expanded', 'false')
        }
        svg.node()!.dataset.majorLocation = ''
        await Promise.all([transition, resetHighlights()])
        await setTabIndex()
    }

    async function focusMajorLocation(loc: Location) {
        svg.selectAll('.pin').remove()
        let svgElem = svg.node()!
        if (svgElem.dataset.majorLocation === loc.id) return
        let majorLoc: SVGGroupSelection<Location> = d3.select(loc.selector)
        let minorLoc: SVGGroupSelection<null> = d3.select(loc.groupSelector)
        let showLocations = async () => {
            await sleep(500)
            svgElem.classList.add('zoom')
            svgElem.querySelector('.focused')?.classList.remove('focused')
            majorLoc.attr('aria-expanded', 'true')
            minorLoc.node()!.classList.add('focused')
        }
        svgElem.dataset.majorLocation = loc.id
        await Promise.all([zoomToLocation(majorLoc.datum()), showLocations()])
        await setTabIndex()
    }

    async function focusMinorLocation(loc: Location) {
        svg.selectAll('.pin').remove()
        let selected: SVGElemSelection<Location> = d3.select(loc.selector)
        let anchor = selected.select('.location')
        let x = Number(anchor.attr('cx') || anchor.attr('x'))
        let y = Number(anchor.attr('cy') || anchor.attr('y'))
        await asyncAnimFrame()
        let pin = d3
            .select(selected.node()!.parentElement)
            .append('path')
            .attr('class', 'pin')
            .attr('transform', `translate(${x - 12},${y - 40}) scale(1.5)`)
            .attr('d', 'M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z')
        await asyncAnimFrame()
        pin.attr('class', 'pin show')
        await setTabIndex()
        selected.node()?.focus()
    }

    async function focusOutOfBound(loc: Location) {
        svg.node()?.querySelector('.focused')?.classList.remove('focused')
        d3.select<SVGGElement, any>(loc.selector).node()?.parentElement?.classList.add('focused')
        await zoomToLocation(loc, 2)
        await setTabIndex()
    }

    async function hashChange(ev: HashChangeEvent | null = null, reset: boolean = true) {
        let loc = getCurrentLocation()
        let focus: (loc: Location) => Promise<any> = async () => await setTabIndex()
        if (!loc) {
            if (reset) {
                focus = resetFocus
            }
        } else if (loc.isGroup) {
            focus = focusMajorLocation
        } else if (loc.isOutOfBound) {
            focus = focusOutOfBound
        } else {
            focus = async (loc: Location) => {
                await focusMajorLocation(loc.parent!)
                await focusMinorLocation(loc)
            }
        }
        artifactPanel.visible = false
        if (loc) {
            document.title = `${loc.shortName} | DMTP Spring 2020`
        } else {
            document.title = 'Home | DMTP Spring 2020'
        }
        await Promise.all([focus(loc!), setDetails(loc)])
    }

    window.addEventListener('hashchange', hashChange)
    window.addEventListener('keydown', (ev) => {
        let isLocation = (datum: Location | Multimedia): datum is Location => {
            return (datum as Location).lat !== undefined
        }
        if (ev.key === 'Enter') {
            let focused = d3.select<Element | null, Location | Multimedia | null>(document.activeElement)
            let loc = focused.datum()
            if (loc && isLocation(loc)) {
                setCurrentLocation(loc)
            }
        } else if (ev.key === 'Backspace') {
            let loc = getCurrentLocation()
            if (loc) {
                if (loc.parent && !loc.parent.isHidden) {
                    setCurrentLocation(loc.parent)
                } else {
                    setCurrentLocation(null)
                }
            }
        }
    })

    let root = svg.select<SVGGElement>('#root')
    let groups = Object.values(locations).filter((loc) => loc.isGroup)

    function setInteractions(selection: SVGGroupSelection<Location>) {
        selection
            .on('mouseenter', function (ev: MouseEvent, d) {
                if (d3.select(this).select('.label').size()) return
                removeLabel()
                addLabel(this, d, [12, 6], 1 / d3.zoomTransform(root.node()!).k)
            })
            .on('mouseleave', function (ev: MouseEvent, d) {
                removeLabel()
            })
            .on('focus', async function (ev: FocusEvent, d) {
                if (d3.select(this).select('.label').size()) return
                removeLabel()
                addLabel(this, d, [12, 6], 1 / d3.zoomTransform(root.node()!).k)
            })
            .on('click', function (ev: MouseEvent, d) {
                setCurrentLocation(d)
            })
    }

    let majorLocations = root
        .append('g')
        .attr('class', 'localities major-locations')
        .selectAll('circle.area')
        .data(groups)
        .enter()
        .append('g')
        .attr('id', (d) => `loc-${d.id}`)
        .attr('class', 'locality')
        .attr('role', 'navigation')
        .attr('aria-label', (d) => `Place: ${d.shortName}`)
        .attr('aria-expanded', 'false')
        .attr('visibility', (d) => (d.isHidden ? 'hidden' : 'visible'))
        .sort((a, b) => -Location.comparator(a, b))

    majorLocations
        .append('circle')
        .attr('class', 'area')
        .attr('cx', (d) => projection(d.coord)![0])
        .attr('cy', (d) => projection(d.coord)![1])
        .attr('r', (d) => meterToPoints(projection, d.coord, d.radius))
        .append('title')
        .text((d) => d.name)

    setInteractions(majorLocations)

    for (let loc of groups) {
        let minorLocations = root
            .append('g')
            .attr('id', `group-${loc.id}`)
            .attr('class', 'localities minor-locations')
            .attr('role', 'navigation')
            .attr('aria-label', () => `Region: ${loc.shortName}`)
            .selectAll('.location')
            .data(loc.children)
            .enter()
            .append('g')
            .attr('id', (d) => `loc-${d.id}`)
            .attr('role', 'navigation')
            .attr('aria-label', (d) => `Place: ${d.shortName}`)
            .attr('class', (d) => (d.isOutOfBound ? 'locality out-of-bound' : 'locality'))
            .sort((a, b) => -Location.comparator(a, b))

        if (minorLocations.classed('out-of-bound')) {
            minorLocations
                .append('rect')
                .attr('class', 'location')
                .attr('x', (d) => _.clamp(projection(d.coord)![0], 0, size[0] - 20))
                .attr('y', (d) => _.clamp(projection(d.coord)![1], 120, size[1] - 120))
                .attr('width', 20)
                .attr('height', 60)
                .append('title')
                .text((d) => d.name)
        } else {
            minorLocations
                .append('circle')
                .attr('class', 'location')
                .attr('cx', (d) => projection(d.coord)![0])
                .attr('cy', (d) => projection(d.coord)![1])
                .attr('r', 10)
                .append('title')
                .text((d) => d.name)
        }

        setInteractions(minorLocations)
    }

    hashChange(null, false)
}

export function init() {
    if (!document.querySelector('#map')) return
    initData().then(initMap)
}
