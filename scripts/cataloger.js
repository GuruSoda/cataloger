const db = require('../db').conectar('./database/catalog.sqlite3')
const controller = require('../components/catalog/controller')
const commandLineArgs =  require('command-line-args')
const findFiles = require('files-in-directory')
const path = require('path')
const fs = require('fs')
const utils = require('./utils')

// Ejemplos de uso:
// catalog.js --help
// catalog.js create --nombre=... --directorio=...
// catalog.js search --str=...
// catalog.js update --label=... 

let mainOptions

// https://github.com/chalk/chalk
// https://github.com/75lb/command-line-usage
// https://github.com/75lb/command-line-usage/wiki
try {
    /* first - parse the main command */
    const mainDefinitions = [
        { name: 'command', defaultOption: true },
        { name: 'help', alias: 'h', type: Boolean }
    ]

    mainOptions = commandLineArgs(mainDefinitions, { stopAtFirstUnknown: true })
    const argv = mainOptions._unknown || []
    
    /* second - parse the merge command options */
    if (mainOptions.command === 'check') {
        const checkDefinitions = [
            { name: 'verbose', alias: 'v', type: Boolean },
            { name: 'directory', alias: 'd', type: String, multiple: false },
            { name: 'label', alias: 'l', type: String, multiple: false },
            { name: 'showmissing', alias: 'm', type: Boolean, multiple: false, defaultValue: true },
            { name: 'showexists', alias: 'e', type: Boolean, multiple: false, defaultValue: false },
            { name: 'onlyfs', alias: 'f', type: Boolean, multiple: false, defaultValue: false },
            { name: 'onlydb', alias: 'b', type: Boolean, multiple: false, defaultValue: false },
        ]
        mainOptions.Options = commandLineArgs(checkDefinitions, { argv })
    } else if (mainOptions.command === 'update') {
        const updateDefinitions = [
            { name: 'verbose', alias: 'v', type: Boolean },
            { name: 'directory', alias: 'd', type: String, multiple: false },
            { name: 'label', alias: 'l', type: String, multiple: false },
            { name: 'hash', alias: 'h', type: Boolean, multiple: false, defaultValue: false },
            { name: 'showmissing', alias: 'm', type: Boolean, multiple: false, defaultValue: true },
            { name: 'showexists', alias: 'e', type: Boolean, multiple: false, defaultValue: false },
            { name: 'onlyfs', alias: 'f', type: Boolean, multiple: false, defaultValue: false },
            { name: 'onlydb', alias: 'b', type: Boolean, multiple: false, defaultValue: false },
        ]
        mainOptions.Options = commandLineArgs(updateDefinitions, { argv })
    } else if (mainOptions.command === 'create') {
        const createDefinitions = [
            { name: 'verbose', alias: 'v', type: Boolean },
            { name: 'directory', alias: 'd', type: String, multiple: false },
            { name: 'label', alias: 'l', type: String, multiple: false },
            { name: 'wildard', alias: 'w', type: String, multiple: false },
            { name: 'hash', alias: 'h', type: Boolean, multiple: false },
            { name: 'bulk', alias: 'b', type: Boolean, multiple: true },
        ]
        mainOptions.Options = commandLineArgs(createDefinitions, { argv })
    } else if (mainOptions.command === 'search') {
        const searchDefinitions = [
            { name: 'verbose', alias: 'v', type: Boolean },
            { name: 'directory', alias: 'd', type: String, multiple: false },
            { name: 'label', alias: 'l', type: String, multiple: false },
            { name: 'str', alias: 's', type: String, multiple: false },
        ]
        mainOptions.Options = commandLineArgs(searchDefinitions, { argv })
    } else if (mainOptions.command === 'info') {
        const infoDefinitions = [
            { name: 'verbose', alias: 'v', type: Boolean },
            { name: 'files', alias: 'f', type: Boolean, multiple: false },
            { name: 'filetypes', alias: 't', type: Boolean, multiple: false },
            { name: 'label', alias: 'l', type: String, multiple: false },
            { name: 'equalsbysize', alias: 's', type: Boolean, multiple: false },
            { name: 'equalsbyhash', alias: 'h', type: Boolean, multiple: false },
        ]
        mainOptions.Options = commandLineArgs(infoDefinitions, { argv })
    } else if (mainOptions.command === 'delete') {
        const deleteDefinitions = [
            { name: 'verbose', alias: 'v', type: Boolean },
            { name: 'file', alias: 'f', type: String, multiple: false },
            { name: 'directory', alias: 'd', type: String, multiple: false },
            { name: 'label', alias: 'l', type: String, multiple: false },
        ]
        mainOptions.Options = commandLineArgs(deleteDefinitions, { argv })
    } else {
        console.log('Unknown option: ', mainOptions.command)
        return 2
    }
} catch (e) {
    console.log(e.message)
    return 1
}

// console.log('mainOptions:', mainOptions)

switch (mainOptions.command) {
    case 'create':
        create(mainOptions.Options)
        break
    case 'check':
        check(mainOptions.Options)
        break
    case 'search':
        search(mainOptions.Options)
        break
    case 'info':
        info(mainOptions.Options)
        break
    case 'update':
        update(mainOptions.Options)
        break
    case 'delete':
        remove(mainOptions.Options)
        break
}

async function create(opt) {
    try {
        const totalFiles = await controller.getTotalFiles({label: opt.label})
        let it = findFiles(opt.directory)

        let actual=0
        db.begin()
        while (it.name) {
            try {
                let infoFile = await extractInfoFile({path: it.path, label: opt.label, hast: opt.hash})
                infoFile.label = opt.label
                await controller.add(infoFile)
                actual++
                console.log('✅ ', it.path)

              } catch (error) {
                    if (error.code === 1 ) console.log(`🚫 `, it.path)
                    else console.log('Error: ', error.message)
            }

            it = it.next()
        }
        db.commit()
        console.log('Total:', actual)
    } catch (error) {
        console.log('Error: ', error.message)
    }
}

function check(opt) {
    opt.exists = opt.showexists
    opt.missing = opt.showmissing

    if (opt.onlyfs) checkfs(opt)
    if (opt.onlydb) checkdb(opt)

    if (!opt.onlyfs && !opt.onlydb) checkfull(opt)
}

async function search(opt) {
    try {
        const res = await controller.searchFiles(opt)
        if (res) {
            let show = res.map(function (file) {
                return {
                    id: file.id,
                    directory: file.directory,
                    name: file.name,
                    bytes: utils.formatBytes(file.bytes),
                    date: new Date(file.date)
                }
              })
            console.table(show)
        }
    } catch(error) {
        console.log('Error: ', error.message)
    }
}

async function info(opt) {
    try {
        if (opt.filetypes) {
            let res = await controller.resumenFileType(opt)
            if (res) {
                let total = 0
                for (const file of res) {
                    file.human = utils.formatBytes(file.bytes)
                    total =  total + file.bytes
                }
                console.table(res)
                console.log('Size total: ', utils.formatBytes(total))
            }
        } else if (opt.equalsbysize) {
            const res = await controller.equalsBySize({label: opt.label})
            let show = res.map(function (file) {
                return {
                    name: file.name,
                    bytes: utils.formatBytes(file.bytes),
                }
              })
            console.table(show)
        } else if (opt.equalsbyhash) {
            const res = await controller.equalsByHash({label: opt.label})
            let show = res.map(function (file) {
                return {
                    name: file.name,
                    bytes: utils.formatBytes(file.bytes),
                    //hash: file.checksum,
                }
              })
            console.table(show)
        }
    } catch(error) {
        console.log('Error: ', error.message)
    }
}

async function update(opt) {
    opt.exists = opt.showexists
    opt.missing = opt.showmissing

    opt.update = true

    if (opt.onlyfs) checkfs(opt)
    if (opt.onlydb) checkdb(opt)

    if (!opt.onlyfs && !opt.onlydb) checkfull(opt)
}

async function remove(opt) {
    try {
        if (opt.label && !opt.directory && !opt.file) {
            await controller.deleteLabel(opt.label)
        }

        if (opt.label && opt.directory && !opt.file) {
            const borrados = await controller.deleteDirectory(opt.label, opt.directory)
            console.log('Borrados:', borrados)
        }

        if (opt.label && opt.directory && opt.file) {
            const infoFile = await controller.getFile(path.join(opt.directory, opt.file), { label: opt.label })
            await controller.deleteFile(infoFile.id, opt.label)
        }
    } catch (error) {
        console.log('Error: ', error.message)        
    }
}

async function checkfs (opt) {
    const start = new Date();

    try {
        const totalFiles = await controller.getTotalFiles({label: opt.label})
        let it = findFiles(opt.directory)

        let actual=0
        while (it.name) {
            actual++
            const o = await controller.getFile(it.path, { label: opt.label })

            if (o) {
                const date = new Date(it.stat().mtime).getTime()
                if (o.date !== date || o.bytes !== it.stat().size) {
                    try {
                        if (opt.update) {
                            let infoFile = await extractInfoFile({path: it.path, hash: (o.checksum) ? true : false})
                            infoFile.id = o.id
                            infoFile.label = o.label
                            await controller.updateFile(infoFile)
                            console.log('[✅✅ Updated]:', it.path)
                        }
                    } catch (e) {
                        console.log('[❌❌ Error Updating]:', it.path)
                    }
                } else {
                    if (opt.exists) console.log('[✅ Exists]:', it.path)
                }
            } else {
                if (opt.update) {
                    let infoFile = await extractInfoFile({path: it.path, hash: (opt.hash) ? true : false})
                    infoFile.label = opt.label
                    await controller.add(infoFile)

                    console.log('[✅✅✅ New]:', it.path)
                } else {
                    if (opt.missing) console.log('[❌ Missing]:', it.path)
                }
            }

            process.stdout.write(actual + '/' + totalFiles + "\r")
            it = it.next()
        }

        const end = new Date()

        console.log("\n", end.getTime() - start.getTime(), "ms")
    } catch (error) {
        console.log('Error: ', error.message)
    }
 
}

async function checkdb(options) {

    const start = new Date();

    let opt = {}

    opt.limit = 1
    opt.label = options.label
    opt.lastid = 0

    let files
    let stat
    try {
        let actual=0
        const totalFiles = await controller.getTotalFiles({label: opt.label})
        files = await controller.getCatalog(opt)
        opt.limit = 5000
        while (files.length !== 0) {

            for (const file of files) {
                actual++
                try {
                    stat = fs.lstatSync(path.join(file.directory, file.name), {bigint: false, throwIfNoEntry: true})

                    if (options.update) {
                        const date = new Date(stat.mtime).getTime()
                        if (file.date !== date || file.bytes !== stat.size) {

                            toUpdate = {
                                date: date,
                                bytes: stat.size,
                                checksum: (file.checksum) ? await utils.hash(it.path) : undefined,
                                description: file.description
                            }

                            await controller.updateFile(file.id)
                        }
                    } else {
                        if (options.exists) console.log('✅ ', path.join(file.directory, file.name))
                    }
                } catch (error) {
                    if (options.missing) console.log('❌ ', path.join(file.directory, file.name))

                    if (options.update) {
                        if (await controller.deleteFile(file.id)) console.log('✅✅ ', path.join(file.directory, file.name))
                        else console.log('❌❌ ', path.join(file.directory, file.name))
                    }
                }
                process.stdout.write(actual + '/' + totalFiles + "\r")
            }
            opt.lastid = files[files.length-1].id            
            files = await controller.getCatalog(opt)
        }
    
        const end = new Date();

        console.log("\n", end.getTime() - start.getTime(), "ms");
    } catch (error) {
        console.log('Error: ', error.message)
    }
}

async function checkfull(opt) {

    const start = new Date();

    try {
        const totalFiles = await controller.getTotalFiles({label: opt.label})
        const idtx = await controller.prepareUpdateCatalog({label: opt.label})

        if (idtx) {
            let actual=0
            let it = findFiles(opt.directory)
    
            while (it.name) {
                actual++

                if (!await controller.updatePreparedCatalog({idtx: idtx, path: it.path, date: new Date(it.stat().mtime).getTime(), bytes: it.stat().size })){
                    if (opt.update) {
                        let infoFile = await extractInfoFile({path: it.path, hash: (opt.hash) ? true : false})
                        infoFile.label = opt.label
                        await controller.add(infoFile)
    
                        console.log('[✅✅✅ New]', it.path)
                    } else {                    
                        console.log('[❌ Not Cataloged]:' + it.path)
                    }
                }

                process.stdout.write(actual + '/' + totalFiles + "\r")
                it = it.next()
            }

            const sinfs = await controller.resultUpdatePreparedCatalog({idtx: idtx})
            console.table(sinfs)

            for (const file of sinfs) {
                console.log('[❌ Depuring]:' + file.path)
                await controller.deleteFile(file.id, opt.label)
            }

            await controller.closePreparedCatalog({idtx: idtx})
        }

        const end = new Date()

        console.log("\n", end.getTime() - start.getTime(), "ms")
    } catch (error) {
        console.log('Error: ', error.message)
    }
}

async function fstodb (opt) {
    try {
        let it = findFiles(opt.dir)

        while (it.name) {
            const o = await controller.getFile(it.path, { label: opt.label })

            if (o) {
                if (opt.update) {
                    const date = new Date(it.stat().mtime).getTime()
                    if (o.date !== date || o.bytes !== it.stat().size) {
                        o.date = date
                        o.bytes = it.stat().size
                        o.checksum = (opt.nohash) ? o.checksum : await utils.hash(it.path)

                        if (await controller.updateFile(o))
                            console.log('✅✅✅ ', it.path)
                        else
                            console.log('❌❌❌ ', it.path)
                    }
                }

                if (opt.exists) console.log('✅ ', it.path)
            } else {
                if (opt.update) {
                    const infoFile = await extractInfoFile({path: it.path, hash: true})
                    infoFile.label = opt.label
                    if (await controller.add(infoFile))
                        console.log('✅✅ ', it.path)
                    else
                        console.log('❌❌❌ ', it.path)
                } else {
                    if (opt.missing) console.log('❌ ', it.path)
                }
            }

            it = it.next()
        }
    } catch (error) {
        console.log('Error: ', error.message)
    }
}

async function extractInfoFile(opt) {

    const parsed = path.parse(opt.path)

    const stat = fs.lstatSync(opt.path, {bigint: false, throwIfNoEntry: false})

    if (!stat) return undefined

    const info = {
        directory: parsed.dir,
        name: parsed.base,
        date: new Date(stat.mtime).getTime(),
        bytes: stat.size,
        checksum: opt.hash ? await utils.hash(opt.path) : undefined,
        description: undefined
    }

    return info
}
