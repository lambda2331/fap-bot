const p = require('phin')

const BASE_URL = 'https://apartments-api-node-js.herokuapp.com/'
const SEARH_KUFAR = 'search_kufar'
const SEARCH_IRR = 'search_irr'

function search (type, params) {
    const promises = []

    switch (type) {
        case SEARH_KUFAR: {
            promises.push(searchKufar(params))
            break
        }
        case SEARCH_IRR: {
            promises.push(searchIrr(params))
            break
        }
        default: {
            promises.push(searchKufar(params))
            promises.push(searchIrr(params))
        }
    }

    return Promise.all(promises).then(results => results.map(item => item.body).flat())
}

function searchKufar (params) {
    return p({
        url: generateUrl('kufar', params),
        parse: 'json'
    })
}

function searchIrr (params) {
    return p({
        url: generateUrl('irr', params),
        parse: 'json'
    })
}

function generateUrl (path, params) {
    const url = new URL(path, BASE_URL)
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))
    return url
}

module.exports.search = search
module.exports.SEARCH_IRR = SEARCH_IRR
module.exports.SEARH_KUFAR = SEARH_KUFAR