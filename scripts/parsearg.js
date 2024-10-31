const commandLineArgs =  require('command-line-args')
const commandLineUsage =  require('command-line-usage')

// Ejemplos de uso:
// catalog.js --help
// catalog.js create --nombre=... --directorio=...
// catalog.js search --str=...
// catalog.js update --label=...

const checkDefinitions = [
    { name: 'verbose', alias: 'v', type: Boolean },
    { name: 'directory', alias: 'd', type: String, multiple: false },
    { name: 'label', alias: 'l', type: String, multiple: false },
    { name: 'showmissing', alias: 'm', type: Boolean, multiple: false, defaultValue: true },
    { name: 'showexists', alias: 'e', type: Boolean, multiple: false, defaultValue: false },
    { name: 'onlyfs', alias: 'f', type: Boolean, multiple: false, defaultValue: false },
    { name: 'onlydb', alias: 'b', type: Boolean, multiple: false, defaultValue: false },
]

const updateDefinitions = [
    { name: 'verbose', alias: 'v', type: Boolean },
    { name: 'directory', alias: 'd', type: String, multiple: false },
    { name: 'label', alias: 'l', type: String, multiple: false },
    { name: 'hash', alias: 'h', type: Boolean, multiple: false, defaultValue: false },
    { name: 'showmissing', alias: 'm', type: Boolean, multiple: false, defaultValue: true },
    { name: 'showexists', alias: 'e', type: Boolean, multiple: false, defaultValue: false },
    { name: 'onlyfs', alias: 'f', type: Boolean, multiple: false, defaultValue: false },
    { name: 'onlydb', alias: 'b', type: Boolean, multiple: false, defaultValue: false },
    { name: 'cleanemptydirectories', alias: 'c', type: Boolean, multiple: false, defaultValue: false },
]

const createDefinitions = [
    { name: 'verbose', alias: 'v', type: Boolean },
    { name: 'directory', alias: 'd', type: String, multiple: false },
    { name: 'label', alias: 'l', type: String, multiple: false },
    { name: 'wildard', alias: 'w', type: String, multiple: false },
    { name: 'hash', alias: 'h', type: Boolean, multiple: false },
    { name: 'bulk', alias: 'b', type: Boolean, multiple: true },
]

const searchDefinitions = [
    { name: 'verbose', alias: 'v', type: Boolean },
    { name: 'directory', alias: 'd', type: String, multiple: false },
    { name: 'label', alias: 'l', type: String, multiple: false },
    { name: 'str', alias: 's', type: String, multiple: false },
]

const infoDefinitions = [
    { name: 'verbose', alias: 'v', type: Boolean },
    { name: 'files', alias: 'f', type: Boolean, multiple: false },
    { name: 'filetypes', alias: 't', type: Boolean, multiple: false },
    { name: 'label', alias: 'l', type: String, multiple: false },
    { name: 'equalsbysize', alias: 's', type: Boolean, multiple: false },
    { name: 'equalsbyhash', alias: 'c', type: Boolean, multiple: false, description: 'es una descripcion' },
    { name: 'listsubdir', type: Boolean, multiple: false, description: 'List size of subdirectories' },
    { name: 'listfiles', type: Boolean, multiple: false, description: 'List files in subdirectories' },
    { name: 'list', type: Boolean, multiple: false, description: 'List subdirectory' },
    { name: 'directory', alias: 'd', type: String, multiple: false },
]

const deleteDefinitions = [
    { name: 'verbose', alias: 'v', type: Boolean },
    { name: 'file', alias: 'f', type: String, multiple: false },
    { name: 'directory', alias: 'd', type: String, multiple: false },
    { name: 'label', alias: 'l', type: String, multiple: false },
]

const helpDefinitions = [
    { name: 'verbose', alias: 'v', type: Boolean },
    { name: 'file', alias: 'f', type: String, multiple: false },
    { name: 'directory', alias: 'd', type: String, multiple: false },
    { name: 'label', alias: 'l', type: String, multiple: false },
]

function parseError(error) {
    return {
        message: error.message,
        code: error.code
    }
}

function msgErrorCommand(definition, resumen) {
    if (!resumen) resumen = {}

    return commandLineUsage([resumen, {header: 'Valid Options', optionList: definition}])
}

function msgHelpByCommand(command) {
    let message

    const resumen = {
        header: 'Synopsis',
    }

    switch(command) {
        case 'verify':
            resumen.content = `Ayuda de ${command}`
            message = msgErrorCommand(checkDefinitions, resumen)
            break
        case 'update':
            resumen.content = `Ayuda de ${command}`
            message = msgErrorCommand(updateDefinitions, resumen)
            break
        case 'create':
            resumen.content = `Ayuda de ${command}`
            message = msgErrorCommand(createDefinitions, resumen)
            break
        case 'search':
            resumen.content = `Ayuda de ${command}`
            message = msgErrorCommand(searchDefinitions, resumen)
            break
        case 'info':
            resumen.content = `Ayuda de ${command}`
            message = msgErrorCommand(infoDefinitions, resumen)
            break
        case 'delete':
            resumen.content = `Ayuda de ${command}`
            message = msgErrorCommand(deleteDefinitions, resumen)
            break
        case 'help':
            resumen.content = `Ayuda de ${command}`
            message = msgErrorCommand(helpDefinitions, resumen)
            break
        default:
            message = 'Missing command.'
            break
    }

    return message
}

function helpGeneral () {
    const sections = [
        {
            header: 'Example App',
            content: 'Generates something {italic very} important. This is a rather long, but ultimately inconsequential description intended solely to demonstrate description appearance. '
        },
        {
            header: 'Synopsis',
            content: '$ cataloger <command> <options>'
        },
        {
          header: 'Command List',
          content: [
            { name: 'help', summary: 'Display this help.' },
            { name: 'create', summary: 'Create a new Catalog.' },
            { name: 'verify', summary: 'Verify files in a Catalog.' },
            { name: 'search', summary: 'Search files into a Catalog.' },
            { name: 'info', summary: 'Print Information about a Catalog.' },
            { name: 'update', summary: 'Update a Catalog.' },
            { name: 'delete', summary: 'Delete a Label or Directory or file.' },
          ]
        }
      ]
    return commandLineUsage(sections)
}

// https://github.com/chalk/chalk
// https://github.com/75lb/command-line-usage
// https://github.com/75lb/command-line-usage/wiki

function parseArgs () {

    let mainOptions

    try {
        /* first - parse the main command */
        const mainDefinitions = [
            { name: 'command', defaultOption: true },
            { name: 'help', alias: 'h', type: Boolean }
        ]

        mainOptions = commandLineArgs(mainDefinitions, { stopAtFirstUnknown: true })
        const argv = mainOptions._unknown || []
        
        /* second - parse the merge command options */
        if (mainOptions.command === 'verify') { // verify?
            mainOptions.Options = commandLineArgs(checkDefinitions, { argv })
        } else if (mainOptions.command === 'update') {
            mainOptions.Options = commandLineArgs(updateDefinitions, { argv })
        } else if (mainOptions.command === 'create') {
            mainOptions.Options = commandLineArgs(createDefinitions, { argv })
        } else if (mainOptions.command === 'search') {
            mainOptions.Options = commandLineArgs(searchDefinitions, { argv })
        } else if (mainOptions.command === 'info') {
            mainOptions.Options = commandLineArgs(infoDefinitions, { argv })
        } else if (mainOptions.command === 'delete') {
            mainOptions.Options = commandLineArgs(deleteDefinitions, { argv })
        } else if (mainOptions.command === 'help') {
            mainOptions.Options = commandLineArgs(helpDefinitions, { argv })
        } else {
            // sin opciones
            if (!mainOptions.command) throw parseError({message: helpGeneral(), code: 1})

            // Opcion desconocida
            throw parseError({message: 'Unknown option: ' + mainOptions.command + '\n' + helpGeneral(), code: 2})
        }
        // commando valido

        // sin parametros, muestro ayuda
        if (argv.length === 0) throw parseError({message: '', code: 10})

        return mainOptions
    } catch (e) {
        throw parseError({message: msgHelpByCommand(mainOptions.command) + "\n" + e.message, code: e.code})
    }
}

module.exports = parseArgs
