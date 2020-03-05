// eslint-disable-next-line no-unused-vars
function zoom(element) {
    var actor = $(element).siblings('figure').children('.actor-container')
    if (actor.length < 1) return

    actor = actor[0]
    $(actor).toggleClass('zoomed-in')
    actor.offsetWidth;

    if ($(actor).hasClass('zoomed-in')) {
        $(element).children('a').text('Zoom out')
        $(element).addClass('color-red-bg')
        $(element).removeClass('color-green-bg')

        actor.offsetWidth
    } else {
        $(element).children('a').text('Zoom in')
        $(element).removeClass('color-red-bg')
        $(element).addClass('color-green-bg')

        actor.offsetWidth
    }
}