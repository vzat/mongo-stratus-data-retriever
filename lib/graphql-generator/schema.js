// Generate Schema from JSON
const utils = require('../utils');
const logger = require('../logger');

// function getArgs (json, cName, enableCustomScalar) {
//     const collectionName = cName.replace(/\[|\]/g, '');
//     let args = '(';
//
//     if (json[collectionName] === undefined) {
//         return '';
//     }
//
//     for (const fieldName in json[collectionName]) {
//         const fieldType = json[collectionName][fieldName];
//
//         if (utils.isGraphQLScalar(fieldType)) {
//             args += fieldName + ': ' + fieldType + ', ';
//         }
//         else if (enableCustomScalar) {
//             args += fieldName + ': ' + utils.toProperCase(fieldType) + 'Input' + ', ';
//         }
//     }
//
//     if (args === '(') {
//         return '';
//     }
//
//     return args.slice(0, -2) + ')';
// }

module.exports = {
    generate: function (json) {
        let schema = '';
        let mutation = 'type Mutation {\n';
        let inputs = '';
        let rootInputs = '';

        for (const objName in json) {
            const obj = json[objName];
            schema += 'type ' + objName + ' {\n';

            if (objName !== 'Query') {
                inputs += 'input ' + utils.toProperCase(objName) + 'Input' + ' {\n';
                rootInputs += 'input ' + utils.toProperCase(objName) + 'Input_Root' + ' {\n';
            }

            for (const fieldName in obj) {
                const fieldType = obj[fieldName];

                if (objName === 'Query') {
                    const returnType = fieldType.replace(/\[|\]/g, '');

                    // const queryArgs = getArgs(json, fieldType);
                    schema += '\t' + 'get' + utils.toProperCase(fieldName);
                    schema += '(query: ' + utils.toProperCase(returnType) + 'Input_Root)';
                    // schema += queryArgs;

                    // const mutationArgs = getArgs(json, fieldType, true);
                    mutation += '\t' + 'insert' + utils.toProperCase(fieldName);
                    mutation += '(docs: [' + utils.toProperCase(returnType) + 'Input])';
                    mutation += ': [' + returnType + ']\n';
                    // mutation += '\t' + 'insert' + utils.toProperCase(fieldName) + mutationArgs;
                    // mutation += ': ' + returnType + '\n';

                    mutation += '\t' + 'delete' + utils.toProperCase(fieldName);
                    mutation += '(filter: ' + utils.toProperCase(returnType) + 'Input_Root)';
                    mutation += ': [' + returnType + ']\n';
                    // mutation += '\t' + 'delete' + utils.toProperCase(fieldName) + queryArgs;
                    // mutation += ': ' + returnType + '\n';

                    mutation += '\t' + 'update' + utils.toProperCase(fieldName);
                    mutation += '(filter: ' + utils.toProperCase(returnType) + 'Input_Root, ';
                    mutation += 'update: ' + utils.toProperCase(returnType) + 'Input)';
                    mutation += ': [' + returnType + ']\n';
                }
                else {
                    schema += '\t' + fieldName;

                    inputs += '\t' + fieldName;

                    if (utils.isGraphQLScalar(fieldType.replace(/\[|\]/g, ''))) {
                        inputs += ': ' + fieldType + '\n';
                        rootInputs += '\t' + fieldName + ': ' + fieldType + '\n';
                    }
                    else {
                        if (fieldType.indexOf('[') !== -1 && fieldType.indexOf(']') !== -1) {
                            inputs += ': ' + utils.toProperCase(fieldType.replace(/\]/g, '')) + 'Input]' + '\n';
                        }
                        else {
                            inputs += ': ' + utils.toProperCase(fieldType.replace(/\[|\]/g, '')) + 'Input' + '\n';
                        }
                    }
                }

                schema += ': ' + fieldType + '\n';

            }

            schema += '}\n';

            if (objName !== 'Query') {
                inputs += '}\n';
                rootInputs += '}\n';
            }
        }

        // Add Mutation
        schema += mutation + '}\n';

        // Add Inputs
        schema += inputs;
        schema += rootInputs;

        logger.log('info', schema);

        return schema;
    }
};
