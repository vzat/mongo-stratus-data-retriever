'use strict';
const config = require('config');

const graphqlScalarTypes = [
    'String',
    'Int',
    'Float',
    'Boolean',
    'ID'
];

const self = module.exports = {
    getToken: (auth) => {
        return auth ? auth.replace('Bearer ', '') : undefined;
    },
    getUserFromUrl: (url) => {
        const params = url.split('/');
        return params && params[3] ? params[3] : undefined;
    },
    getServerFromUrl: (url) => {
        const params = url.split('/');
        return params && params[4] ? params[4] : undefined;
    },
    getDBFromUrl: (url) => {
        const params = url.split('/');
        return params && params[5] ? params[5] : undefined;
    },
    getSysDBInfo: () => {
        return {
            ip: config.db.ip,
            port: config.db.port,
            name: config.db.name
        };
    },
    replaceString: (str, rep, pos) => {
        if (pos >= str.length) {
            throw new Error('Position out of bounds');
        }
        return str.substr(0, pos) + rep + str.substr(pos + rep.length);
    },
    toProperCase: (name) => {
        let newStr = name;

        // First Char
        if (typeof newStr !== 'string' || newStr.length === 0) {
            throw new Error('Empty or Invalid String');
        }
        newStr = self.replaceString(newStr, newStr.charAt(0).toUpperCase(), 0);

        const separators = [' ', '_'];

        for (const index in separators) {
            const sep = separators[index];

            let charPos = newStr.indexOf(sep);
            while (charPos !== -1) {
                newStr = self.replaceString(newStr, newStr.charAt(charPos + 1).toUpperCase(), charPos + 1);
                charPos = newStr.indexOf(sep, charPos + 1);
            }
        }

        return newStr;
    },
    isGraphQLScalar: (scalar) => {
        if (graphqlScalarTypes.indexOf(scalar) !== -1) {
            return true;
        }
        return false;
    }
};
