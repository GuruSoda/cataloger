const store = require('./store')
const path = require('path')

function add (dataFile) {
    return new Promise((resolve, reject) => {
        try {
            resolve(store.add(dataFile))
        } catch (error) {
            reject(error)
        }
    })
}

function catalog (file, label="") {
    return new Promise((resolve, reject) => {
    })
}

function getCatalog (label, directory) {
    return new Promise((resolve, reject) => {
    })
}

function getDataFile (file, options) {
    return new Promise((resolve, reject) => {
        if (!options.label) return reject({message: 'Label cannot by empty'})

        try {
            const parsed = path.parse(file)

            const dataFile = {
                label: options.label,
                directory: parsed.dir,
                name: parsed.base
            }

            resolve(store.get(dataFile))
        } catch (error) {
            reject(error)
        }
    })
}

function updateDataFile (dataFile) {
    return new Promise((resolve, reject) => {
        if (!dataFile.label) return reject({message: 'Label cannot by empty'})

        try {
            resolve(store.update(dataFile))
        } catch (error) {
            reject(error)
        }
    })
}

function deleteLabel (label) {
    return new Promise((resolve, reject) => {
        try {
            resolve(store.deleteLabel(label))
        } catch (error) {
            reject(error)
        }
    })
}

function deleteDirectory (label, directory) {
    return new Promise((resolve, reject) => {
        if (!label) return reject({message: 'Label cannot by empty'})

        try {
            resolve(store.deleteDirectory(label, directory))
        } catch (error) {
            reject(error)
        }
    })
}

function deleteFile (id, label) {
    return new Promise((resolve, reject) => {
        if (!label) return reject({message: 'Label cannot by empty'})

        try {
            resolve(store.deleteFile(id, label))
        } catch (error) {
            reject(error)
        }
    })
}

function getCatalog(options) {
    return new Promise((resolve, reject) => {
        try {
            resolve(store.getCatalog(options))
        } catch (error) {
            reject(error)
        }
    })
}

function prepareUpdateCatalog(options) {
    return new Promise((resolve, reject) => {
        try {
            resolve(store.prepareUpdateCatalog(options))
        } catch (error) {
            reject(error)
        }
    })
}

function updatePreparedCatalog(options) {
    return new Promise((resolve, reject) => {
        try {
            resolve(store.updatePreparedCatalog(options))
        } catch (error) {
            reject(error)
        }
    })
}

function resultUpdatePreparedCatalog(options) {
    return new Promise((resolve, reject) => {
        try {
            resolve(store.resultUpdatePreparedCatalog(options))
        } catch (error) {
            reject(error)
        }
    })
}

function closePreparedCatalog(options) {
    return new Promise((resolve, reject) => {
        try {
            resolve(store.closePreparedCatalog(options))
        } catch (error) {
            reject(error)
        }
    })
}

function getTotalFiles(options) {
    return new Promise((resolve, reject) => {
        if (!options.label) return reject({message: 'Label cannot by empty'})
        try {
            resolve(store.getTotalFiles(options))
        } catch (error) {
            reject(error)
        }
    })
}

function searchFiles(options) {
    return new Promise((resolve, reject) => {
        if (!options.label) return reject({message: 'Label cannot by empty'})
        if (!options.str) return reject({message: 'str cannot by empty'})

        try {
            resolve(store.searchFiles(options))
        } catch (error) {
            reject(error)
        }
    })
}

function resumenFileType(options) {
    return new Promise((resolve, reject) => {
        if (!options.label) return reject({message: 'Label cannot by empty'})

        try {
            resolve(store.resumenFileType(options))
        } catch (error) {
            reject(error)
        }
    })
}

function equalsBySize(options) {
    return new Promise((resolve, reject) => {
        if (!options.label) return reject({message: 'Label cannot by empty'})

        try {
            resolve(store.equalsBySize(options))
        } catch (error) {
            reject(error)
        }
    })
}

function equalsByHash(options) {
    return new Promise((resolve, reject) => {
        if (!options.label) return reject({message: 'Label cannot by empty'})

        try {
            resolve(store.equalsByHash(options))
        } catch (error) {
            reject(error)
        }
    })
}

function deleteEmptyDirectories(options) {
    return new Promise((resolve, reject) => {
        try {
            resolve(store.deleteEmptyDirectories(options))
        } catch (error) {
            reject(error)
        }
    })
}

function sizeSubDirectories(options) {
    return new Promise((resolve, reject) => {
        if (!options.label) return reject({message: 'Label cannot by empty'})
        if (!options.directory) return reject({message: 'Directory cannot by empty'})

        try {
            resolve(store.sizeSubDirectories(options))
        } catch (error) {
            reject(error)
        }
    })
}

function filesInDirectory(options) {
    return new Promise((resolve, reject) => {
        if (!options.label) return reject({message: 'Label cannot by empty'})
        if (!options.directory) return reject({message: 'Directory cannot by empty'})

        try {
            resolve(store.filesInDirectory(options))
        } catch (error) {
            reject(error)
        }
    })
}

module.exports = { 
    add, 
    getFile:getDataFile, 
    getCatalog, 
    updateFile: updateDataFile, 
    catalog, 
    deleteLabel,
    deleteFile,
    deleteDirectory,
    prepareUpdateCatalog,
    updatePreparedCatalog,
    resultUpdatePreparedCatalog,
    closePreparedCatalog,
    searchFiles,
    resumenFileType,
    getTotalFiles,
    equalsBySize,
    equalsByHash,
    deleteEmptyDirectories,
    sizeSubDirectories,
    filesInDirectory
}
