'use strict';
const config = require(config);

module.exports = {
    getToken: (auth) => {
        return auth.replace('Bearer ', '');
    },
    getUserFromUrl: (url) => {
        const params = url.split('/');
        return params && params[3] ? params[3] : undefined;
    },
    getDBFromUrl: (url) => {
        const params = url.split('/');
        return params && params[4] ? params[4] : undefined;
    },
    getSysDBUri: () => {
        return 'mongodb://' + config.db.ip + ':' + config.db.port + '/' + config.db.name;
    }
};
