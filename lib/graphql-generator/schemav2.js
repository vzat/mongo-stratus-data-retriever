// Generate Schema from JSON
const logger = require('../logger');
const utils = require('../utils');

module.exports = {
    generate: function (json) {
        let schema = '';

        for (const objName in json) {
            const obj = json[objName];
            schema += 'type ' + objName + ' {\n';

            for (const fieldName in obj) {
                const fieldType = obj[fieldName];

                if (objName === 'Query') {
                    schema += '\t' + 'get' + utils.toProperCase(fieldName) + ': ' + fieldType + '\n';
                }
                else {
                    schema += '\t' + fieldName + ': ' + fieldType + '\n';
                }
            }

            schema += '}\n';
        }

        // TODO: Mutation - use Query object and add 'set' instead of 'get'

        logger.log('debug', schema);

        return schema;
    }
};
