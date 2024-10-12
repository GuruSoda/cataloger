const Model = require('./model')
const { LRUCache } = require('lru-cache')

const cacheLabel = new LRUCache({max: 50})
const cacheDirectory = new LRUCache({max: 5000})

const stmtAddFile = Model.prepare('insert or rollback into catalog(labelid, directoryid, name, bytes, date, description, checksum) values(?, ?, ?, ?, ?, ?, ?)')
const stmtGetLabel = Model.prepare('select id,name,description from label where name = ?')
const stmtAddLabel = Model.prepare('insert into label(name, description) values (?, ?)')
const stmtGetDirectory = Model.prepare('select id,name,description from directory where name = ?')
const stmtAddDirectory = Model.prepare('insert into directory(name, description) values (?, ?)')
const stmtGetIdFile = Model.prepare('select id from catalog where name = ?')

// Busquedas no case sensitive
// SELECT * FROM ... WHERE name = 'someone' COLLATE NOCASE

function customError(errordb) {
    let resp = {}

    resp.errorMessage = errordb.message
    resp.errorCode = errordb.code

    switch (errordb.code) {
        case 'SQLITE_CONSTRAINT_UNIQUE':
                resp.message = 'Exists'
                resp.code = 1
            break
        case 'SQLITE_BUSY':
                resp.message = 'Base de datos bloqueada'
                resp.code = 2
            break
        case 'SQLITE_ERROR':
                resp.message = 'Error la base de datos: ' + errordb.message + ` (${errordb.code})`
                resp.code = 3
            break
        case 'SQLITE_CONSTRAINT_NOTNULL':
                resp.message = 'Campo no puede ser NULL'
                resp.code = 4
                break
        default:
            resp.message = 'Desconocido: ' + errordb.message + ` (${errordb.code})`
            resp.code = -1
    }

    return resp
}

function randonTableName(length=10) {
    let result      = '';
    const characters  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for ( let i = 0; i < length; i++ ) result += characters.charAt(Math.floor(Math.random() * characters.length))

    return result;
}

function add(dataFile) {
    try {
        dataFile.labelID = cacheLabel.get(dataFile.label)
        if (!dataFile.labelID) {
            dataFile.labelID = getOrInsertLabel(dataFile.label).id
            cacheLabel.set(dataFile.label, dataFile.labelID)
        }

        dataFile.directoryID = cacheDirectory.get(dataFile.directory)
        if (!dataFile.directoryID) {
            dataFile.directoryID = getOrInsertDirectory(dataFile.directory).id
            cacheDirectory.set(dataFile.directory, dataFile.directoryID)
        }
        
        const output = stmtAddFile.run(dataFile.labelID, dataFile.directoryID, dataFile.name, dataFile.bytes, dataFile.date, dataFile.description, dataFile.checksum)

        return output.changes > 0
    } catch (error) {
        throw(customError(error))
    }
}

function getFile (dataFile) {
    try {
        const stmGetFile =  Model.prepare('\
            SELECT \
                f.id,tag.name as label,dir.name as directory,f.name,f.bytes,f.date,f.checksum,f.description \
            FROM \
                catalog f \
            INNER JOIN \
                directory dir on f.directoryid = dir.id \
            INNER JOIN \
                label tag on f.labelid = tag.id \
            WHERE \
                dir.name = ? and f.name = ? and tag.name = ?')

        return stmGetFile.get(dataFile.directory, dataFile.name, dataFile.label)
    } catch (error) {        
        throw(customError(error))
    }
}

function getCatalog (options) {
    try {
        const stmGetCatalog =  Model.prepare('\
            SELECT \
                f.id, dir.name as directory, f.name, f.bytes, f.date, f.checksum, f.description \
            FROM \
                catalog f \
            INNER JOIN \
                directory dir on f.directoryid = dir.id \
            INNER JOIN \
                label tag on f.labelid = tag.id \
            WHERE \
                tag.name = ? \
                and f.id > ? \
            ORDER BY \
                f.id \
            LIMIT ?')

        return stmGetCatalog.all(options.label, options.lastid, options.limit)

    } catch (error) {        
        throw(customError(error))
    }
}

function updateFile(dataFile) {

    try {
        const stmUpdateFile =  Model.prepare('\
            UPDATE catalog \
                SET \
                    bytes=?,\
                    date=?,\
                    description=?,\
                    checksum=? \
            WHERE id = ?')

        const output = stmUpdateFile.run(dataFile.bytes, dataFile.date, dataFile.description, dataFile.checksum, dataFile.id)

        if (output.changes > 0) return true
        else return false
    } catch (error) {
        throw(customError(error))
    }
}

function deleteLabel(label) {
    try {
        const stmDeleteLabel =  Model.prepare('DELETE FROM label WHERE name = ?')

        const output = stmDeleteLabel.run(label)

        return output.changes
    } catch (error) {        
        throw(customError(error))
    }
}

function deleteDirectory(label, directory) {
    try {
        const stmDeleteDirectory =  Model.prepare("\
            DELETE FROM catalog \
			WHERE id IN ( \
				SELECT \
					f.id \
				FROM \
					catalog f \
				INNER JOIN \
					directory dir on f.directoryid = dir.id \
				INNER JOIN \
					label l on f.labelid = l.id \
				WHERE \
					l.name = ? \
					and dir.name like ? || '%' \
			)")

        const output = stmDeleteDirectory.run(label, directory)

        return output.changes
    } catch (error) {        
        throw(customError(error))
    }
}

function deleteFile(id, label) {
    try {
        const stmDeleteFile =  Model.prepare('DELETE FROM catalog WHERE id=?')

        const output = stmDeleteFile.run(id)

        return output.changes
    } catch (error) {        
        throw(customError(error))
    }
}

function deleteFileInCatalog(label, directory, file) {
    try {
        const stmDeleteFile =  Model.prepare('\
            DELETE FROM catalog \
			WHERE id IN ( \
				SELECT \
					f.id \
				FROM \
					catalog f \
				INNER JOIN \
					directory dir on f.directoryid = dir.id \
				INNER JOIN \
					label l on f.labelid = l.id \
				WHERE \
					l.name = ? \
					and dir.name = ? \
                    and f.name = ? \
			)')

        const output = stmDeleteFile.run(label, directory, file)

        if (output.changes > 0) return true
        else return false
    } catch (error) {        
        throw(customError(error))
    }
}

function getOrInsertLabel(name, description) {
    let label

    try {
        label = stmtGetLabel.get(name)

        if (!label) {
            label = stmtAddLabel.run(name, description)
            label = stmtGetLabel.get(name)
        }
    } catch (error) {
        throw(customError(error))
    }

    return label
}

function getOrInsertDirectory(name, description) {
    let directory

    try {
        directory = stmtGetDirectory.get(name)

        if (!directory) {
            directory = stmtAddDirectory.run(name, description)
            directory = stmtGetDirectory.get(name)
        }
    } catch (error) {
        return undefined
    }

    return directory
}

function getTotalFiles(options) {
    try {
        const stmGetCountFiles =  Model.prepare('\
            SELECT \
                count(c.id) as total \
            FROM \
                catalog c \
            INNER JOIN \
                label l on c.labelid = l.id \
            WHERE \
                l.name = ?')

        return stmGetCountFiles.get(options.label).total
    } catch (error) {
        throw(customError(error))
    }
}

function prepareUpdateCatalog(options) {
    try {
        const tableName = randonTableName()

        // const stmCreateAndInsert = Model.prepare(`\
        //     CREATE TEMPORARY TABLE ${tableName} AS \
        //     SELECT \
        //         c.id,\
        //         dir.name || '/' || c.name as path,\
        //         c.date,\
        //         c.bytes \
        //     FROM \
        //         catalog c \
        //     INNER JOIN \
        //         directory dir  on c.directoryid = dir.id \
        //     INNER JOIN \
        //         label l on c.labelid = l.id \
        //     WHERE \
        //         l.name = ?`)

        // stmCreateAndInsert.run(options.label)

        const stmCreateAndInsertV2 = `\
            CREATE TEMPORARY TABLE ${tableName} (\
                id integer not null,
                path text not null,
                date integer not null,
                bytes integer not null,
                UNIQUE (path, date, bytes)
            );\
            INSERT INTO ${tableName}(id, path, date, bytes) \
                SELECT \
                    c.id, \
                    dir.name || '/' || c.name as path,\
                    c.date,\
                    c.bytes \
                FROM \
                    catalog c \
                INNER JOIN \
                    directory dir  on c.directoryid = dir.id \
                INNER JOIN \
                    label l on c.labelid = l.id \
                WHERE \
                    l.name = '${options.label}';`

        Model.exec(stmCreateAndInsertV2)

        return tableName
    } catch (error) {
        throw customError(error)
    }
}

function updatePreparedCatalog(opt) {
    try {
        const stmDeleteFromPrepared = Model.prepare(`\
            DELETE FROM ${opt.idtx} \
            WHERE \
	            path = ? \
	            and bytes = ? \
                and date = ?`)

        const output = stmDeleteFromPrepared.run(opt.path, opt.bytes, opt.date)

        return output.changes
    } catch (error) {
        throw customError(error)
    }
}

function resultUpdatePreparedCatalog(opt) {
    try {
        const stmCreateAndInsert =  Model.prepare(`\
            SELECT \
                id, \
                path,\
                date,\
                bytes \
            FROM \
                ${opt.idtx}`)

        return stmCreateAndInsert.all()
    } catch (error) {
        throw customError(error)
    }
}

function closePreparedCatalog(opt) {
    try {
        const stmCreateAndInsert =  Model.prepare(`DROP TABLE IF EXISTS ${opt.idtx}`)

        return stmCreateAndInsert.run().changes
    } catch (error) {
        throw customError(error)
    }
}

function searchFiles(options) {
    try {
        const stmSeachFiles =  Model.prepare("\
            SELECT \
                f.id,dir.name as directory,f.name,f.bytes,f.date,f.checksum,f.description \
            FROM \
                catalog f \
            INNER JOIN \
                directory dir on f.directoryid = dir.id \
            INNER JOIN \
                label tag on f.labelid = tag.id \
            WHERE \
                tag.name = ? \
                and f.name like '%' || ? || '%' \
            LIMIT 1000")

        return stmSeachFiles.all(options.label, options.str)
    } catch (error) {
        throw customError(error)
    }
}

function resumenFileType(options) {
    try {
        const stmSeachFiles =  Model.prepare("\
            SELECT \
                regexp_substr('\.[0-9a-zA-Z_\S]+$', c.name) as extension, sum(c.bytes) as bytes, count(c.id) as cantidad \
            FROM \
                catalog c \
            INNER JOIN \
                directory dir on c.directoryid = dir.id \
            INNER JOIN \
                label l on c.labelid = l.id \
            WHERE \
                l.name = ? \
            GROUP by \
                extension \
            HAVING \
                cantidad > 0 \
            ORDER by \
                cantidad DESC \
            LIMIT 500")

        return stmSeachFiles.all(options.label)
    } catch (error) {
        throw customError(error)
    }
}

function equalsBySize (options) {
    
    try {
        const stmEqualsBySize =  Model.prepare("\
        SELECT \
            d.name || '/' || c.name as name,\
            c.bytes \
        FROM \
            catalog c \
        INNER JOIN \
            directory d ON c.directoryid = d.id \
        INNER JOIN \
            label l ON c.labelid = l.id \
        WHERE \
            l.name = ? AND \
            c.bytes IN (\
                SELECT \
                    c2.bytes \
                FROM \
                    catalog c2 \
                INNER JOIN \
                    label l2 on c2.labelid = l2.id \
                WHERE \
                    l2.name = ? \
                GROUP BY \
                    c2.bytes \
                HAVING \
                    COUNT(*) > 1\
                )\
        ORDER BY \
            c.bytes DESC \
        LIMIT 500")

        return stmEqualsBySize.all(options.label, options.label)
    } catch (error) {
        throw customError(error)
    }
}

function equalsByHash (options) {
    
    try {
        const stmEqualsBySize =  Model.prepare("\
        SELECT \
            d.name || '/' || c.name as name,\
            c.checksum, \
            c.bytes \
        FROM \
            catalog c \
        INNER JOIN \
            directory d ON c.directoryid = d.id \
        INNER JOIN \
            label l ON c.labelid = l.id \
        WHERE \
            l.name = ? AND \
            c.checksum IN (\
                SELECT \
                    c2.checksum \
                FROM \
                    catalog c2 \
                INNER JOIN \
                    label l2 on c2.labelid = l2.id \
                WHERE \
                    l2.name = ? \
                GROUP BY \
                    c2.checksum \
                HAVING \
                    COUNT(*) > 1\
                )\
        ORDER BY \
            c.checksum DESC \
        LIMIT 500")

        return stmEqualsBySize.all(options.label, options.label)
    } catch (error) {
        throw customError(error)
    }
}

module.exports = { 
    add,
    get:getFile,
    getCatalog,
    getTotalFiles,
    update:updateFile,
    deleteLabel,
    deleteDirectory,
    deleteFile,    
    prepareUpdateCatalog,
    updatePreparedCatalog,
    resultUpdatePreparedCatalog,
    closePreparedCatalog,
    searchFiles,
    resumenFileType,
    equalsBySize,
    equalsByHash
}
