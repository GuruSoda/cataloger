const Database = require('better-sqlite3')

Database.prototype.begin    = function() { this.prepare('BEGIN'   ).run(); }
Database.prototype.commit   = function() { this.prepare('COMMIT'  ).run(); }
Database.prototype.rollback = function() { this.prepare('ROLLBACK').run(); }

// V1
let db = undefined

function conectar (filedb) {
    if (db) return db

    db = new Database(filedb, { verbose: null })

    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')

    // https://github.com/nalgeon/sqlean?tab=readme-ov-file
    // https://antonz.org/sqlean-regexp/    
    //regexp_like
    //regexp_substr
    // regexp_replace

    db.function('regexp', { deterministic: true }, (regex, text) => {
//        console.log('regex:', regex, ' - text:', text)
//        console.log('regex:', regex)
        // if (text === '/mnt/Juegos/Computer/Sinclair - ZX Spectrum CD/_ReadMe_.txt') {
        //     console.log('Encontrado!')

        //     console.log('regex:', regex, ' - text:', text)

        //     const out = new RegExp(regex).test(text) ? 1 : 0

        //     if (out) {
        //         console.log('Si a la regexp')
        //     } else {
        //         console.log('NO a la regexp')
        //     }
        // }

        const out = new RegExp(regex).test(text) ? 1 : 0
        // if (out)
        //     console.log('SI regex:', regex, ' - text:', text)
        // else
        //     console.log('NO regex:', regex, ' - text:', text)

        return out
      });
      
    db.function('regexp_substr', { deterministic: true }, (regex, text) => {

//        console.log('regexp_substr:', regex, ' - text:', text)

        const resp = new RegExp(regex).exec(text)

//        console.log(resp[0])

//        if (!resp) console.log('Not Match:', regex, ' - ', text)

//        if (text === '/mnt/Juegos/Computer/GameBase64 v12.torrent') console.log('lo encontre!')

//            console.log(resp)

        // if (resp && resp[0].length === text.length) { //console.log('sin extension text :', text, ' resp:', resp)
        //     console.log(resp)
        //     return ''
        // }

        return resp ? resp[0] : ''
    });

    return db
}

function getdb() {
    return db
}

module.exports = {conectar, getdb}

/*
//V2
const db = new Database('punteros.sqlite3', { verbose: console.log })
db.pragma('journal_mode = WAL');

module.exports = db
*/
