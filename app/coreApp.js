const express = require('express')
const bodyParser = require('body-parser')
const localAddress = require('./localAddress.js')
const Q = require('q')

/*** bot/app/coreApp.js ***
  APIを簡単に開く
  共通で使える

    start(selectPort, callback)
      callback: サーバが起動したら呼び出す

    openApi(apiName)
      /api/{apiName}が開かれる
      GET ot POST

    on(apiName, callback)
      /api/{apiName}が叩かれたときにcallbackを呼ぶ
      callback(query)

    getAddress()
      ローカルアドレスを返す
*/

let app = express()
app.use(bodyParser.json())

let defaultPort = 3000
let port = defaultPort

let address = localAddress()

// Callbackを入れていく
let Callbacks = {}


//　はじめに呼び出す

exports.start = (selectPort, callback) => {
    console.log('ローカルアドレス：')
    console.log(address)

    port = selectPort ? selectPort : defaultPort

    //ローカルサーバーの起動
    let server = app.listen(port, () => {
        let host = server.address().address
        let port = server.address().port
        console.log('app listening at http://%s:%s', host, port)

        // コールバック
        if (typeof callback == 'function') {
            callback()
        }
    })
}


// api/{apiName} を開く

exports.openApi = (apiName) => {
    Callbacks[apiName] = new Callback(apiName)
}

// require先から登録

exports.on = (apiName, applyCallback) => {
    if (Callbacks[apiName]) {
        Callbacks[apiName].on(applyCallback)
    }
}


// apiが叩かれたときにコールバックするクラス

function Callback(apiName) {
    this.apiName = apiName
    this.callback = () => {}
}


// コールバックの登録

Callback.prototype.on = function(applyCallback) {
    if (typeof applyCallback == 'function') {
        this.callback = applyCallback
    }
}


// 実行

Callback.prototype.emit = function(value1, value2, value3) {
    return this.callback(value1, value2, value3)
}


// GET

app.get('/:method', (req, res) => {
    // GET req.query

    // method
    let method = req.params.method
    console.log('GET', method, req.query)

    // コールバック関数呼び出し
    if (Callbacks[method]) {
        let value = Callbacks[method].emit(req.query)
        value = value == null ? true : value
        if (Q.isPromise(value)) {
            value.then((r) => {
                    res.send(r)
                })
                .catch((e) => {
                    res.send(e)
                })
        } else {
            res.send(value)
        }
    } else {
      let errorMessage = 'do not work  /api/' + method
      console.log(errorMessage)
      res.send(errorMessage)
    }

})


// POST

app.post('/:method', (req, res) => {
    // POST req.body
    res.setHeader('Content-Type', 'text/plain')

    // method
    let method = req.params.method
    console.log('POST', method, req.body)
    if (Callbacks[method]) {
        let value = Callbacks[method].emit(req.body)
        value = value == null ? true : value
        if (Q.isPromise(value)) {
            value.then((r) => {
                    res.send(r)
                })
                .catch((e) => {
                    res.send(e)
                })
        } else {
            res.send(value)
        }
    } else {
        let errorMessage = 'do not work  /api/' + method
        console.log(errorMessage)
        res.send(errorMessage)
    }
})


// localAddressを返す
exports.getAddress = () => {
    return address
}
