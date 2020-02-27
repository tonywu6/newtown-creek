const API_ROOT = 'api/'

const ID_MENU_CONTENT = '#top-menu-content'
const CLS_LI = 'subway-li'
const CLS_BASE_LABEL = 'subway-label hl hl-colored'

const metadata = {}

function collectRoutes() {
    return new Promise((resolve, reject) => {
        $.ajax(API_ROOT + 'metadata.json')
            .fail((xhr, status, err) => {
                reject(status, err)
            })
            .then(dict => {
                if (!dict) console.error('ERROR: Cannot load nav bar contents')

                let path = window.location.pathname || '/'
                if (window.location.hostname != 'localhost')
                    path = path.substring(17)
                const names = {
                    '/index.html': 'frontpage',
                    '/': 'frontpage',
                }
                let urls = []
                metadata.routes = dict.routes
                for (let u of metadata.routes)
                    if (names[path]) {
                        if (
                            !u.hidden ||
                            (u.hidden != true && u.hidden != names[path])
                        ) {
                            urls.push(u)
                        }
                    } else {
                        if (u.hidden != true) urls.push(u)
                    }
                urls.sort((u1, u2) => {
                    let d = u1.order - u2.order
                    if (d) return d
                    return u1.url.charCodeAt(0) - u2.url.charCodeAt(0)
                })
                resolve(urls)
            })
    })
}

function initNavBar(urls) {
    const navList = $('#subway-nav')

    for (let u of urls) {
        let li = $('<li></li>')
        let p = $('<p></p>')
        let a = $('<a></a>')
        li.addClass(CLS_LI)
        p.addClass(CLS_BASE_LABEL)
        p.addClass(u.decoration)
        a.attr('href', u.url)
        a.text(u.name)
        li.append(p)
        p.append(a)
        navList.append(li)
    }


    $('#nav-switch').on('click', toggleMenu)

    if (window.location.hash == ID_MENU_CONTENT) toggleMenu()
}

function toggleMenu() {
    toggleFlex($(ID_MENU_CONTENT))
    $('#nav-switch img').toggleClass('rotate-45')
}
function toggleFlex(e) {
    $(e).toggleClass('hidden')
    $(e).toggleClass('flex')
    return !$(e).hasClass('hidden')
}

function initFloatingTitle() {
    let article = $('article')
    let pageName = $('[itemprop="nav-name"]')
    if (!article || !pageName) return

    pageName = pageName && pageName.attr('content')
    let titleDiv = $('<div></div>')
    titleDiv.attr('id', 'floating-title')
    let titleH3 = $('<h3></h3>')
    titleDiv.append(titleH3)
    titleH3.text(pageName)
    titleDiv.prependTo(article)
}

$(document).ready(() => {
    collectRoutes()
        .then(routes => initNavBar(routes))
        .catch((status, err) => {
            console.log(status)
            console.error(err)
            console.log('ERROR: Cannot load nav bar contents')
        })
    initFloatingTitle()
})
