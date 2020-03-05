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