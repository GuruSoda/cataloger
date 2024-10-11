const crypto = require('crypto')
const fs = require('fs')

function hash(file, algorithm='md5') {

    return new Promise(function (resolve, reject) {

        const readStream = fs.createReadStream(file, {highWaterMark: 64*1024, enconding: 'binary'})
        const hash = crypto.createHash(algorithm)

        readStream.on('data', (chunk) => {
            hash.update(chunk)
        })

        readStream.on('end', () => {
            resolve(hash.digest('hex'))
        })

        readStream.on('error', (err) => {
            reject(err)
        })
    })
}

function formatBytes(bytes) {
    const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    if (bytes === 0) return '0 Bytes';
    
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / Math.pow(1024, index);
    
    return value.toFixed(2) + ' ' + units[index];
}


module.exports = { hash, formatBytes }