const log4js = require('log4js')

const configLogger = {
    appenders : {
        everything : {
            type : 'dateFile',
            filename : process.env.LOG_PATH,
            pattern : '-yyyy-MM-dd',
            // pattern : 'yyyy-MM-dd-hh-mm',
            maxLogSize : process.env.LOG_MAX_SIZE,
            numBackups : process.env.LOG_ROTATE,
            compress : process.env.LOG_COMPRESS,
            keepFileExt : true,
            fileNameSep : '-',
            layout : {
                type : 'pattern',
                pattern : '%d{yyyy-MM-dd hh:mm:ss.SSS}|' + process.env.APP + '|%p|%m'
            }
        },
        errorFile : {
            type : 'dateFile',
            filename : process.env.LOG_PATH_ERRORS,
            pattern : '-yyyy-MM-dd',
            // pattern : 'yyyy-MM-dd-hh-mm',
            maxLogSize : process.env.LOG_MAX_SIZE,
            numBackups : process.env.LOG_ROTATE_ERRORS,
            compress : process.env.LOG_COMPRESS,
            keepFileExt : true,
            fileNameSep : '-',
            layout : {
                type : 'pattern',
                pattern : '%d{yyyy-MM-dd hh:mm:ss.SSS}|' + process.env.APP + '|%p|%m'
            }
        },
        errors : {
            type : 'logLevelFilter',
            level : 'ERROR',
            appender : 'errorFile'
        }
    },
    categories : {
        default : { appenders : ['everything', 'errors'], level : process.env.LOG_LEVEL || 'debug' },
    }
}

// function getConfig() {
//     // Habilita a visualizacao de logs no monitor do pm2 somente para development
//     if ( process.env.ENVIRONMENT === 'DEV' ) {
//         const stdout = { console : { type : 'stdout' } }
//         Object.assign( configLogger.appenders, stdout )
//         configLogger.categories.default.appenders.push( 'console' )
//     }
//     return configLogger
// }

log4js.configure( configLogger )

const logger = log4js.getLogger()
module.exports = logger
