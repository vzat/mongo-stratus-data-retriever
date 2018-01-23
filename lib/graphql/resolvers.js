// Generate Resolvers from JSON
const logger = require('./../logger');
const scalarTypes = [
    'String',
    'Int',
    'Float',
    'Boolean',
    'ID'
];

function getData(fieldName) {
    return 'DB Data for ' + fieldName;
}

function getResolvers(json, typeName) {
    const jsonString = JSON.stringify(json);
    if (jsonString.indexOf(typeName) === -1) {
        throw new Error('Cannot find Query');
    }

    let resolvers = {};

    const objType = json[typeName];

    const fields = Object.keys(objType);
    for (const fieldNo in fields) {
        const fieldName = fields[fieldNo];
        const field = objType[fieldName];

        // Check if it is a custom scalar
        if (field.return.indexOf('!') !== -1 && scalarTypes.includes(field.return.slice(0, -1)) ||
            scalarTypes.includes(field.return)) {

            logger.log('info', fieldName);
            resolvers[fieldName] = function () {
                return getData(fieldName);
            };
        }
        else {
            let customScalar = field.return;
            if (customScalar.indexOf('!') !== -1) {
                customScalar = customScalar.slice(0, -1);
            }

            logger.log('info', customScalar);

            resolvers[fieldName] = getResolvers(json, 'type ' + customScalar);
        }
    }

    return resolvers;
}

module.exports = {
    generate: function (json) {
        let resolvers = {};
        const fields = json.fields;

        for (const field in fields) {
            // Change to function that returns data from the db
            resolvers[field] = function () {
                return 'DB ' + field;
            };
        }

        return resolvers;
    },
    generatev2: function (json) {
        // let resolvers = {};
        //
        // for (const type in json) {
        //     const typeData = json[type];
        //
        //     logger.log('info', type);
        //     logger.log('info', typeData);
        // }



        // let resolvers = {};
        //
        // let test = {};
        // test['abc'] = function () {
        //     return 'DB abc';
        // }
        // test['wasd'] = function () {
        //     return 'DB wasd';
        // }
        //
        // resolvers['test'] = test;
        // resolvers['test2'] = function () {
        //     return 'DB test2';
        // }
        //
        // return resolvers;


        const jsonString = JSON.stringify(json);
        if (jsonString.indexOf('type Query') === -1) {
            throw new Error('Cannot find Query');
        }

        // Recursively add resolvers from lower down types to the higher ones
        // Maybe use a recursive function

        //
        // const types = Object.keys(json);
        //
        // for (const typeNo in types) {
        //     const typeName = types[typeNo];
        //     const type = json[typeName];
        // }

        return getResolvers(json, 'type Query');
    }
};
