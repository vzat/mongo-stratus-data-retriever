// Generate Schema from JSON
const logger = require('../logger');
const utils = require('../utils');

function getArgs (json, cName, enableCustomScalar) {
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
        else if (enableCustomScalar) {
            args += fieldName + ': ' + utils.toProperCase(fieldType) + 'Input' + ', ';
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
        let mutation = 'type Mutation {\n';
        let inputs = '';

        for (const objName in json) {
            const obj = json[objName];
            schema += 'type ' + objName + ' {\n';

            if (objName !== 'Query') {
                inputs += 'input ' + utils.toProperCase(objName) + 'Input' + ' {\n';
            }

            for (const fieldName in obj) {
                const fieldType = obj[fieldName];

                if (objName === 'Query') {
                    const queryArgs = getArgs(json, fieldType);
                    schema += '\t' + 'get' + utils.toProperCase(fieldName);
                    schema += queryArgs;

                    const returnType = fieldType.replace(/\[|\]/g, '');
                    const mutationArgs = getArgs(json, fieldType, true);
                    mutation += '\t' + 'insert' + utils.toProperCase(fieldName) + mutationArgs;
                    mutation += ': ' + returnType + '\n';

                    mutation += '\t' + 'delete' + utils.toProperCase(fieldName) + queryArgs;
                    mutation += ': ' + returnType + '\n';

                    mutation += '\t' + 'update' + utils.toProperCase(fieldName);
                    mutation += '(filter: ' + utils.toProperCase(returnType) + 'Input, ';
                    mutation += 'update: ' + utils.toProperCase(returnType) + 'Input)';
                    mutation += ': ' + returnType + '\n';
                }
                else {
                    schema += '\t' + fieldName;

                    inputs += '\t' + fieldName;

                    if (utils.isGraphQLScalar(fieldType)) {
                        inputs += ': ' + fieldType + '\n';
                    }
                    else {
                        inputs += ': ' + utils.toProperCase(fieldType) + 'Input' + '\n';
                    }
                }

                schema += ': ' + fieldType + '\n';

            }

            schema += '}\n';

            if (objName !== 'Query') {
                inputs += '}\n';
            }
        }

        // Add Mutation
        schema += mutation + '}\n';

        // Add Inputs
        schema += inputs;

        logger.log('info', schema);

        return schema;
    }
};
