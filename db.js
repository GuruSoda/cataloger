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
        return new RegExp(regex).test(text) ? 1 : 0
      });
      
    db.function('regexp_substr', { deterministic: true }, (regex, text) => {

        const resp = new RegExp(regex).exec(text)

//        if (!resp) console.log('regexp null text :', text)

        if (resp && resp[0].length === text.length) //console.log('sin extension text :', text, ' resp:', resp)
            return ''

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
