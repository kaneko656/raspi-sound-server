/*** Queue.js ***

    ロック機能とコール機能つきのキュー

    enq

    deq

    available

    onAvailable

    setLock

    setCall

    changeData

    exist

    length

    prot
      内部パラメータをテキストで可視化
*/

module.exports = function(size) {
    return new Queue(size)
}


// size: キューの最大数

Queue = function(size) {
    this.size = (size && !isNaN(size)) ? size : 10
    this.head = 0
    this.tail = 0
    this.list = []
    for (let i = 0; i < this.size; i++) {
        this.list[i] = {}
    }
    this.callback = () => {}
    this.call = false
}


//　データを入れる
// data: なんでも
// lock: boolean(取り出しの可否）
// reutrn: id  （利用できないときは-1）

Queue.prototype.enq = function(data, lock) {
    let overCheckTail = this.tail + 1
    let overCheckHead = this.head
    overCheckHead = overCheckHead < this.tail ? overCheckHead + this.size : overCheckHead
    if (this.tail < overCheckHead && overCheckHead <= overCheckTail) {
        return -1
    }

    let id = this.tail
    let date = new Date()
    let prof = {
        id: id,
        ts: date.getTime(),
        date: date.toString(),
        lock: lock ? true : false
    }
    let n = this.tail
    this.list[n] = {
        prof: prof,
        data: data
    }
    this.tail = next(this.tail, this.size, 1)

    if(!lock){
      checkCall(this)
    }
    return id
}


//　次のデータを取り出す

Queue.prototype.deq = function() {
    if (this.head == this.tail) {
        return 'none'
    }
    let n = this.head
    if (this.list[n] && this.list[n].prof && this.list[n].prof.lock) {
        return 'locked'
    }
    let data = this.list[n]
    this.head = next(this.head, this.size, 1)
    return data
}


//　次のデータが利用できるか

Queue.prototype.available = function() {
    if (this.head == this.tail) {
        return false
    }
    let n = this.head
    if (!this.list[n].prof.lock) {
        return true
    }
    return false
}


//　次のデータが利用できるときにコールバックする

Queue.prototype.onAvailable = function(callback) {
    if (typeof callback == 'function') {
        this.callback = callback
        this.call = true
    }
}


//　そのid番号のロックの変更
//  id: enqのreturnで返ってくる数字
//  lock: boolean(取り出しの可否）

Queue.prototype.setLock = function(id, lock) {
    if (isNaN(id) || id < 0 || id >= this.size) {
        return 'outOfNumber'
    }
    this.list[id].prof.lock = lock ? true : false
    checkCall(this)
}


//　データの内容を変更

Queue.prototype.changeData = function(id, data) {
    if (isNaN(id) || id < 0 || id >= this.size) {
        return 'outOfNumber'
    }
    this.list[id].data = data
    checkCall(this)
}


//　コールバックの呼び出しの可否の変更

Queue.prototype.setCall = function(set) {
    this.call = set ? true : false
    checkCall(this)
}


//　データが存在

Queue.prototype.exist = function() {
    return this.head != this.tail
}


// キューに溜まっている長さ

Queue.prototype.length = function() {
    if (this.head == this.tail) {
        return 0
    }
    if (this.head >= this.tail) {
        return this.tail + this.size - this.head
    }
    return this.tail - this.head
}


// 内部パラメータをconsoleで可視化

Queue.prototype.prot = function(br) {
    br = br ? true : false
    let text = ''
    let numLength = Number(String(this.size-1).length)
    let bHead = this.head - 1 >= 0 ? this.head - 1 : this.head -1 + this.size
    let bTail = this.tail - 1 >= 0 ? this.tail - 1 : this.tail -1 + this.size
    this.list.forEach((l, i) => {

        text += ('   ' + i).slice(-1 * numLength)
        if (l && l.prof && l.prof.lock) {
            text += 'o'
        } else {
            text += ' '
        }

        if (i == bHead && bHead == bTail) {
            text += 'N '
        } else if (i == bHead) {
            text += '→ '
        } else if (i == bTail) {
            text += '← '
        } else {
            text += '  '
        }
        if (br) {
            text += '\r\n'
        }
    })
    console.log(text)
    return text
}

// 次の位置（ループ）
const next = (num, size, addNum) => {
    addNum = addNum ? addNum : 1
    return (size <= num + addNum) ? (num + addNum - size) : (num + addNum)
}

// 次が利用できる、かつ、callbackのとき
const checkCall = (queue) => {
    if (queue.call && queue.available()) {
        queue.callback(queue.deq())
        checkCall(queue)
    }
}
