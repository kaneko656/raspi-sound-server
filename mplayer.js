let spawn = require('child_process').spawn

exports.sendQuery = (query) => {
    if (query && query.stop) {
        module.exports.stop()
    } else if (query && query.url) {
        if (typeof query.url == 'string' && query.url.indexOf('http') >= 0) {
            module.exports.play(query.url)
        }
    }
}

exports.play = (url) => {

    let shspawn = (command) => {
        return spawn('sh', ['-c', command])
    }

    // kill
    let cmdKill = 'killall mplayer'
    shSpawn(cmdKill, () => {
        // console.log('finish killall mplayer')
    })

    // play
    let cmd = 'mplayer -playlist ' + url
    console.log(cmd)
    shSpawn(cmd, () => {
        console.log('close')
    })
}

exports.stop = () => {
    let cmdKill = "killall mplayer"
    shSpawn(cmdKill, () => {
        console.log('stop')
    })
}

const shSpawn = (cmd, callback) => {

    let shspawn = (command) => {
        return spawn('sh', ['-c', command])
    }

    let child = shspawn(cmd)
    let buf = ''

    child.stdout.on('data', function(data) {
        buf = buf + data
    })

    child.stderr.on('data', function(data) {
        //console.log('exec error: '+data)
    })

    child.on('close', function(code) {
        if (typeof callback == 'function') {
            callback()
        }
    })
}
