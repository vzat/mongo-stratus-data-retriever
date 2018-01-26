const MongoClient = require('mongodb').MongoClient;
const logger = require('../utils/logger.js');
const config = require('config');
let localDB = null;

module.exports = {
    connectLocal: function () {
        const uri = 'mongodb://' + config.db.server + ':' + config.db.port + '/mongo';
        let retries = 0;

        return new Promise(function (resolve, reject) {
            let interval = setInterval(function () {
                MongoClient.connect(uri)
                    .then(function (database) {
                        logger.log('info', 'Connected to ' + uri);
                        localDB = database;
                        clearInterval(interval);
                        resolve();
                    })
                    .catch(function (err) {
                        if (retries % 10 === 0) {
                            logger.log('warn', err);
                        }
                        if (++retries >= config.db.maxRetries) {
                            logger.log('info', err);
                            clearInterval(interval);
                            reject('Cannot connect to the database');
                        }
                    });
            }, config.db.intervalRetries);
        });
    }
};
