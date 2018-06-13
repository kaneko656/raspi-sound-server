const VoiceText = require('voicetext')
const fs = require('fs')
const Q = require('q')

let cachePath = __dirname + '/../soundfile'
let cache = {}
let cacheThr = 1
try {
    cache = require(cachePath + '/cache.json')
} catch (e) {}

module.exports = function(apiKey) {
    return new Sound(apiKey)
}

/*** createSound.js ***
　音声ファイルを生成する
　
  → text, option, filePath
    音声ファイル生成
  ← 終了したらコールバック

  今はVoiceTextだけど中身の実装は入れ替え（追加）していい
*/

function Sound(apiKey) {

    //合成音声の読み込みとwavファイル作成・再生
    this.voice = new VoiceText(apiKey)
    // console.log(this.voice)

    // option表示
    // this.viewOption()

}


// option表示

Sound.prototype.viewOption = function() {
    // VoiceTextのoption
    const printOption = (printData) => {
        console.log('VoiceTextのオプション一覧')
        for (let key in printData) {
            console.log(key + ' = ')
            console.log(printData[key])
        }
    }
    let printData = {
        speaker: this.voice.SPEAKER,
        emotion: this.voice.EMOTION,
        emotion_level: this.voice.EMOTION_LEVEL
    }
    printOption(printData)
}


// soundの生成
// → text, option, filePath
//   音声ファイル生成
// ← 終了したらコールバック

Sound.prototype.create = function(query, filePath, callback) {
    let d = Q.defer()
    let text = query.text ? query.text : ''
    let speaker = query.speaker ? query.speaker : this.voice.SPEAKER.HIKARI
    let emotion = query.emotion ? query.emotion : this.voice.EMOTION.HAPPINESS
    let emotion_level = query.emotion_level ? query.emotion_level : this.voice.EMOTION_LEVEL.LOW
    let pitch = query.pitch ? query.pitch : 100
    let speed = query.speed ? query.speed : 100
    let volume = query.volume ? query.volume : 100

    //  キャッシュのチェック
    if (cache.list) {
        for (let i = 0; i < cache.list.length; i++) {
            let c = cache.list[i]
            if (c.speaker === speaker && c.emotion === emotion && c.emotion_level === emotion_level &&
                Math.abs(c.pitch - pitch) <= cacheThr && Math.abs(c.speed - speed) <= cacheThr && Math.abs(c.volume - volume) <= cacheThr && c.text === text) {
                d.resolve(cachePath + '/cache' + i + '.wav')
                if (typeof callback == 'function') {
                    callback(cachePath + '/cache' + i + '.wav')
                }
                return d.promise
            }
        }
    }



    console.log('     createSound() by VoiceText', text, speaker, emotion, emotion_level, pitch, speed, volume)
    this.voice.speaker(speaker)
        .emotion(emotion)
        .emotion_level(emotion_level)
        .pitch(pitch)
        .speed(speed)
        .volume(volume)
        .speak(text, function(e, buf) {


            // キャッシュデータ

            cache.list = cache.list ? cache.list : []

            console.log(cache.list.length)
            cacheName = '/cache' + cache.list.length + '.wav'
            fs.writeFile(cachePath + cacheName, buf, 'binary', (e) => {})
            cache.list.push({
                file: cacheName,
                text: text,
                speaker: speaker,
                emotion: emotion,
                emotion_level: emotion_level,
                pitch: pitch,
                speed: speed,
                volume: volume
            })
            fs.writeFile(cachePath + '/cache.json', JSON.stringify(cache, null, '    '), (err) => {
                if(err){
                    console.log(err)
                }
            })


            return fs.writeFile(filePath, buf, 'binary', (e) => {
                if (e) {
                    d.reject(e)
                    return console.error(e)
                }
                d.resolve(filePath)
                if (typeof callback == 'function') {
                    callback(filePath)
                }
            })
        })
    return d.promise
}
