const db = require('../../db').getdb()

const catalog = "\
CREATE TABLE if not exists label (\
    id integer primary key autoincrement,\
    name text unique not null collate nocase,\
    description text collate nocase\
);\
CREATE TABLE if not exists directory (\
    id integer primary key autoincrement,\
    name text unique not null,\
    description text collate nocase\
);\
CREATE TABLE if not exists catalog (\
    id integer primary key autoincrement,\
    labelid integer not null,\
    directoryid integer not null,\
    name text not null,\
    bytes integer not null,\
    date integer not null,\
    description text collate nocase,\
    checksum text collate nocase,\
    UNIQUE(labelid, directoryid, name),\
    FOREIGN KEY (labelid) REFERENCES label (id) on delete cascade ON UPDATE NO ACTION,\
    FOREIGN KEY (directoryid) REFERENCES directory (id) on delete cascade ON UPDATE NO ACTION\
);"

db.exec(catalog)

module.exports = db
