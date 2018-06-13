// コンフィグ
let config = {}
try {
    config = require('./config.json')
    console.log(config)
} catch (e) {}

// module
const schedule = require('node-schedule')
const os = require('os')


// parts
const app = require('./app/coreApp.js')
const player = require('./soundPlayer.js')()
const sound = require('./createSound.js')(config.VOICE_TEXT_API)
const queue = require('./queue.js')(30)
const mplayer = require('./mplayer.js')

// variable
// 改行コード
let sep = (os.type().toString() == 'Windows_NT') ? '\\' : '/'
let bsep = (os.type().toString() != 'Windows_NT') ? '\\'.trim() : '/'
let pathCheck = (p) => {
    return p.split(bsep).join(sep)
}

// 自身のサーバを立てる
app.start(config.port || 3000)

app.openApi('control')
app.openApi('mplayer')
app.openApi('on')
app.openApi('off')



/*** main.js ***

    soundCheck()
    注意！　音がなる

    queueCheck()
    注意！　結構長く喋る

    メイン処理
    app app.js
      onControl
      ←　GETからイベント発火
      →　createByQueue

      createByQueue
      音声作成のキュー処理
      → キューに入れる（ロック）
      ← ロック解除

      playByQueue
      音声再生のキュー処理
      → 音声再生（queueの処理を止める）
      ← queueの処理を許可

      queue.onAvailable
      次のキューが利用可能なとき、コールバックを呼ぶ
      ←　次のキューが利用可能になったとき
      →　playByQueue

    player soundPlayer
      play
      →　再生
      ←　終了
    sound createSound
      create
      →　生成
      ←　終了

    mplayer
*/


/*** メイン処理  ***/


// テキストの読み上げ再生

app.on('control', (query) => {
    console.log(query)
    // 時間指定
    if (query.when) {
        let path = ''
        let check = scheduleWork(query.when, () => {
            // キューに入れる　詰まってなければすぐ再生
            let lock = false
            queue.enq(pathCheck(__dirname + '/soundfile/talk' + query.when + '.wav'), lock)
        })
        if (check) {
            createBySchedule(query, query.when)
        }

        // だめだったらそのまま再生
        if (!check) {
            // キューに入れる
            createByQueue(query)
        }
        return
    }

    // 200文字で分割する
    let txt = query.text
    splitByTextLength(txt, 199, (text) => {
        query.text = text
        // キューに入れる
        createByQueue(query)
    })
})

// ストリーミング

app.on('mplayer', (query) => {
    mplayer.sendQuery(query)
})


// 時間指定

const scheduleWork = (when, callback) => {
    when = !isNaN(Number(when)) ? Number(when) : when
    if (typeof when == 'string') {
        console.log('triggerWork: ', when)
        return false
    }
    if (isNaN(when) || new Date().getTime() - 5 * 1000 > when) {
        console.log('scheduleWork error: 時間が過去です')
        return false
    }
    let date = new Date(when)
    console.log('\r\n')
    console.log('>> set sheduleWork: ', date.toString())
    console.log('\r\n')
    schedule.scheduleJob(date, () => {
        console.log('>> start schedule')
        callback()
    })
    return true
}


// text: 文章
// limit: 分割する長さ
// callback: 分割するごとにテキストを返す

const splitByTextLength = (text, limit, callback) => {
    if (typeof text == 'string') {
        if (text.length >= limit) {
            let goText = text.substr(0, limit)
            let leftText = text.substr(limit)
            if (typeof callback == 'function') {
                callback(goText)
            }
            splitByTextLength(leftText, limit, callback)
        } else {
            callback(text)
        }
    }
}


// 音声作成のキュー処理
const createByQueue = (query) => {

    // 音声フォルダ
    let basePath = pathCheck(__dirname + '/soundfile/')

    // ロックをかけた状態でキューに入れる
    let lock = true
    let id = queue.enq('', lock)
    if (id < 0) {
        return
    }

    // talk0.wav, talk1.wav... を音声ファイルとする 　
    let path = basePath + 'talk' + id + '.wav'

    // queue内のデータを変更
    // queue.changeData(id, path)

    // 音声を作成
    sound.create(query, path, (resPath) => {
        queue.changeData(id, resPath)
        console.log(id, resPath)

        // 音声の作成終わったらロックを解除
        lock = false
        queue.setLock(id, lock)
    })
}

// 音声再生のキュー処理

const playByQueue = (res) => {
    // パス情報をもらう
    let path = res.data

    // 再生中は呼ばないようにする（これがないと準備されたら非同期で次々と読み上げる）
    queue.setCall(false)

    // 音声の再生
    player.play(path, () => {

        // キューの内部情報の可視化
        queue.prot()

        // 再生が終わったら呼び出しを許可
        queue.setCall(true)
    })
}

// 音声作成のキュー処理
const createBySchedule = (query, time) => {

    // 音声フォルダ
    let basePath = pathCheck(__dirname + '/soundfile/')

    // talk1483762638136.wav, talk1483762648353.wav... を音声ファイルとする 　
    let path = basePath + 'talk' + time + '.wav'

    // 音声を作成
    sound.create(query, path, () => {})

    return path
}

// キューにデータがある　かつ　次のがロックされてない（解除された）ときに引数の関数を呼ぶ
queue.onAvailable(playByQueue)


/*** ここまでメイン処理  ***/



/*** チェック用の関数  ***/

exports.test = () => {
    soundCheck(() => {
        queueCheck()
    })
}

// サウンドチェック
// まず音声がなるか、次に音声を作成してそれをならせるか

const soundCheck = (resolve = () => {}) => {
    let path1 = pathCheck(__dirname + '/test.wav')
    let path2 = pathCheck(__dirname + '/soundfile/createTest.wav')

    // 音声再生
    console.log('** soundCheck()')
    console.log('   play playing...', path1)
    player.play(path1, () => {
        console.log('     finish play')

        // 音声の作成
        console.log('   create creating...', path2)
        sound.create({
            text: 'テスト2'
        }, path2, () => {
            console.log('     finished soundCreate ')

            // 音声の再生
            console.log('   play createdfile...', path2)
            player.play(path2)
                .then(() => {
                    console.log('     finished play')
                    console.log('** finished soundCheck()\r\n')
                    resolve()
                })
        })
    })
}



//　キューに長めの音声を入れてつまらせてみる．重ならずに順番に再生したらOK

const queueCheck = () => {
    createByQueue({
        text: 'キューは以下の操作が可能なデータ構造です．'
    })
    createByQueue({
        text: 'エンキュー(enqueue)操作  データをキューの末尾に追加'
    })
    createByQueue({
        text: 'デキュー(dequeue)操作  キューの先頭からデータを取り出す'
    })
    createByQueue({
        text: 'キューでは，最初に入れたデータが最初に取り出されるため，FIFO (First In First Out) とも呼ばれます．'
    })
}

/*** ここまでチェック用の関数  ***/
