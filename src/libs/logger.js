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
        }
    },
    categories : {
        default : { appenders : ['everything'], level : process.env.LOG_LEVEL || 'debug' },
    }
}


log4js.configure( configLogger )

const logger = log4js.getLogger()
module.exports = logger
