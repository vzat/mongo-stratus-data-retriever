'use strict';
const config = require('config');

const graphqlScalarTypes = [
    'String',
    'Int',
    'Float',
    'Boolean',
    'ID'
];

module.exports = {
    getToken: (auth) => {
        return auth ? auth.replace('Bearer ', '') : undefined;
    },
    getUserFromUrl: (url) => {
        const params = url.split('/');
        return params && params[3] ? params[3] : undefined;
    },
    getDBFromUrl: (url) => {
        const params = url.split('/');
        return params && params[4] ? params[4] : undefined;
    },
    getSysDBInfo: () => {
        return {
            ip: config.db.ip,
            port: config.db.port,
            name: config.db.name
        };
    },
    toProperCase: (name) => {
        const firstLetter = name.charAt(0).toUpperCase();
        const restOfWord = name.slice(1).toLowerCase();

        return firstLetter + restOfWord;
    },
    isGraphQLScalar: (scalar) => {
        if (graphqlScalarTypes.indexOf(scalar) !== -1) {
            return true;
        }
        return false;
    }
};
