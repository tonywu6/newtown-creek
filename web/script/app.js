const BASE = ''
const API_ROOT = 'api/'
const metadata = {}
console.log(window.location.pathname)

function initNavBar() {
    const LI_CLS = 'subway-li'
    const LABEL_BASE_CLS = 'subway-label hl hl-colored'
    const navList = $('#subway-nav')

    $.ajax(API_ROOT + 'metadata.json')
    .fail((xhr, status, err) => {
        console.log(status)
        console.error(err)
        console.log('ERROR: Cannot load nav bar contents')
    })
    .then((dict) => {
        if (!dict) console.error('ERROR: Cannot load nav bar contents')

        metadata.routes = dict.routes
        let urls = []
        for (let u of metadata.routes)
            if (u.displayed) urls.push(u)
        urls.sort((u1, u2) => {
            let d = u1.order - u2.order
            if (d) return d
            return u1.url.charCodeAt(0) - u2.url.charCodeAt(0)
        })
        for (let u of urls) {
            let li = $('<li></li>')
            let p = $('<p></p>')
            let a = $('<a></a>')
            li.addClass(LI_CLS)
            p.addClass(LABEL_BASE_CLS)
            p.addClass(u.decoration)
            a.attr('href', u.url)
            a.text(u.name)
            li.append(p)
            p.append(a)
            navList.append(li)
        }

    })
}


$(document).ready(() => {
    initNavBar()
})
