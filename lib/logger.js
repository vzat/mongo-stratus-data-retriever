const fs = require('fs');
const winston = require('winston');
const logPath = __dirname + '/../logs/';
const timestamp = (new Date()).toISOString().replace(/:/g, '-');

if (!fs.existsSync(logPath)) {
    fs.mkdirSync(logPath);
}

if (process.env.NODE_ENV === 'production') {
    winston.remove(winston.transports.Console);
    winston.add(winston.transports.File, {
        filename: logPath + 'dataRetriever_' + timestamp + '.log'
    });
}
else if (process.env.NODE_ENV === 'test') {
    winston.remove(winston.transports.Console);
}
else {
    winston.add(winston.transports.File, {
        filename: logPath + 'dataRetriever_dev_' + timestamp + '.log'
    });
}

module.exports = winston;
