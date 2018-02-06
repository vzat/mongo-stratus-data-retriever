// Generate Schema from JSON
const utils = require('../utils');

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

                    schema += '\t' + 'get' + utils.toProperCase(fieldName);
                    schema += '(query: ' + utils.toProperCase(returnType) + 'Input_Root)';

                    mutation += '\t' + 'insert' + utils.toProperCase(fieldName);
                    mutation += '(docs: [' + utils.toProperCase(returnType) + 'Input])';
                    mutation += ': [' + returnType + ']\n';

                    mutation += '\t' + 'delete' + utils.toProperCase(fieldName);
                    mutation += '(filter: ' + utils.toProperCase(returnType) + 'Input_Root)';
                    mutation += ': [' + returnType + ']\n';

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

        return schema;
    }
};
