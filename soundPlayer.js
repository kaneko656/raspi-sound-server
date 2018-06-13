const Aplay = require('node-aplay') // raspiで動いてmacで動かない
const playSound = require('play-sound')() // raspiでは動かない
const simplayer = require('simplayer') // windowsで動くらしい
const os = require('os')
const Q = require('q')

module.exports = function() {
    return new Player()
}

/*** soundPlayer.js ***
　音声ファイルを再生する
　
  → filePath
    音声ファイルを再生
  ← 終了したらコールバック

*/

function Player() {
    // 再生モード
    this.SOUNDMODE = {
        APLAY: 0,
        PLAY: 1,
        SIMPLAYER: 2
    }

    // デフォルト
    this.soundMode = this.SOUNDMODE.APLAY

    // osを見て切り替える
    this.detectSoundMode()
}

// osで切り替える
Player.prototype.detectSoundMode = function() {

    // 実行環境
    let osName = os.type().toString()

    // Raspi
    if (osName == 'Linux') {
        this.soundMode = this.SOUNDMODE.APLAY
        console.log('os type: Lunux', 'soundMode: aplay')
    }
    // Mac
    if (osName == 'Darwin') {
        this.soundMode = this.SOUNDMODE.PLAY
        console.log('os type: Darwin', 'soundMode: play')
    }
    // Windows
    if (osName == 'Windows_NT') {
        this.soundMode = this.SOUNDMODE.SIMPLAYER
        console.log('os type: Windows_NT', 'soundMode: simplayer')
    }
}


// 音声ファイルの再生
// → filePath
//   音声ファイルを再生
// ← 終了したらコールバック

Player.prototype.play = function(filePath, callback) {
    let d = Q.defer()

    // aplay
    if (this.soundMode == this.SOUNDMODE.APLAY) {
        let sound = new Aplay(filePath)
        sound.play()
        sound.on('complete', () => {
            d.resolve('complete')
            if (typeof callback == 'function') {
                callback('complete')
            }
        })
        console.log('APlay(' + filePath + ')')
    }

    // play-sound
    else if (this.soundMode == this.SOUNDMODE.PLAY) {
        playSound.play(filePath, () => {
            d.resolve('complete')
            if (typeof callback == 'function') {
                callback('complete')
            }
        })
        console.log('Play(' + filePath + ')')
    }

    // simplayer
    else if (this.soundMode == this.SOUNDMODE.SIMPLAYER) {
        simplayer(filePath, () => {
            console.log('complete')
            // d.resolve('complete')
            // if (typeof callback == 'function') {
            //     callback('complete')
            // }
        })
        // 諦めた
        setTimeout(() => {
            d.resolve('complete')
            if (typeof callback == 'function') {
                callback('complete')
            }
        }, 3000)
        console.log(new Date().getMilliseconds() + 'ms  simplayer('+filePath+')')
    }
    return d.promise
}
