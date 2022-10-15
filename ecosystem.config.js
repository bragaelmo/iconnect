module.exports = {
    apps : [
        {
            name : 'rex',
            script : './server.js',
            watch : false,
            instance_var : 0,
            error_file : '~/.pm2/logs/rex_errors.log',
            out_file : '~/.pm2/logs/rex.log',
            env : {
            }
        }
    ]
}
