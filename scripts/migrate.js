const db = require('../db').conectar('./database/catalog.sqlite3')
const Database = require('better-sqlite3')
const path = require('path')
const controller = require('../components/catalog/controller')

const origen = new Database('/opt/navegador/databases/chicas.sqlite', { readonly: true, verbose: console.log })
const stmtGetAll = origen.prepare('select file, bytes, date, checksum, description from file')

async function main() {
    try {
        let iterator = stmtGetAll.iterate()

        db.begin()
        for (const file of iterator) {
            const parsed = path.parse(file.file)
            const new_file = {
                label: 'Chicas',
                directory: parsed.dir,
                name: parsed.base,
                date: file.date,
                bytes: file.bytes,
                checksum: file.checksum,
                description: file.description
            }
        
            await controller.add(new_file)
        
            console.log(new_file.directory + '/' + new_file.name)
        }
        db.commit()
    } catch(error) {
        console.log(error)
    }
}

main() 
