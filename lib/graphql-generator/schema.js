// Generate Schema from JSON
const logger = require('../logger');
const utils = require('../utils');

function getArgs (json, cName) {
    const collectionName = cName.replace(/\[|\]/g, '');
    let args = '(';

    if (json[collectionName] === undefined) {
        return '';
    }

    for (const fieldName in json[collectionName]) {
        const fieldType = json[collectionName][fieldName];

        if (utils.isGraphQLScalar(fieldType)) {
            args += fieldName + ': ' + fieldType + ', ';
        }
    }

    if (args === '(') {
        return '';
    }

    return args.slice(0, -2) + ')';
}

module.exports = {
    generate: function (json) {
        let schema = '';

        for (const objName in json) {
            const obj = json[objName];
            schema += 'type ' + objName + ' {\n';

            for (const fieldName in obj) {
                const fieldType = obj[fieldName];

                if (objName === 'Query') {
                    schema += '\t' + 'get' + utils.toProperCase(fieldName);
                    schema += getArgs(json, fieldType);
                }
                else {
                    schema += '\t' + fieldName;
                }

                schema += ': ' + fieldType + '\n';
            }

            schema += '}\n';
        }

        // TODO: Mutation - use Query object and add 'set' instead of 'get'

        logger.log('info', schema);

        return schema;
    }
};
