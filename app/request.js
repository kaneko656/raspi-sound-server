const request = require('request')
const Q = require('q')

exports.post = (baseUrl, apiName, query, callback) => {
    callback = typeof callback == 'function' ? callback : () => {}
    let d = Q.defer()
    let url = baseUrl + apiName
    request.post({
        url: url,
        json: query
    }, (error, response, body) => {
        callback(error, response, body)
        if (!error) {
            d.resolve(body)
        } else {
            d.reject(error)
        }
    })
    return d.promise
}

exports.get = (baseUrl, apiName, argument, callback) => {
    callback = typeof callback == 'function' ? callback : () => {}
    let d = Q.defer()

    // データ整形  URI
    let arg = ''
    for (let key in argument) {
        let content = argument[key]
        if (typeof argument[key] == 'object') {
            content = JSON.stringify(argument[key])
        }
        arg += encodeURI('&') + encodeURIComponent(key) + encodeURI('=') + encodeURIComponent(content)
    }
    let url = encodeURI(baseUrl + apiName + '?') + arg
    let options = {
        url: url
    }

    request.get(options, (error, response, body) => {
        callback(error, response, body)
        if (!error) {
            d.resolve(body)
        } else {
            d.reject(error)
        }
    })
    return d.primise
}
