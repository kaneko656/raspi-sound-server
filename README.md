
# Raspi-Sound-Server

テキストを投げると，音声合成で喋ります．RaspberryPI用に作成したが，MacやWindowsをサーバにしての利用も可能です．


### インストール

- git clone or DL
- `npm install`
- config.jsonにVoiceText Web APIのkeyを入れる
  - https://cloud.voicetext.jp/webapi

### 使い方

サーバを起動する

- `npm run start` or `node main.js`


音が再生するかテストする場合

- `npm run test`


### 機能

投げたテキストを再生します．
- localhost:3000/control?text=こんにちは

音量をオフにします．クエリを投げても再生しません．
- localhost:3000/off

音量をオンにします．
- localhost:3000/on

指定した時間に再生します.
- localhost:3000/control?text=こんにちは&when={UTCミリ秒}

### その他
- キューの機能があります．連続で音声を投げても，重ならずに順番に再生します．
- 長文の分割機能があります．VoiceText Web APIを超える分量の場合は自動で分割します．
- GET or POSTリクエストに対応しています・
