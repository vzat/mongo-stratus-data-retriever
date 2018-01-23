// Generate Resolvers from JSON
const logger = require('./../logger');
const scalarTypes = [
    'String',
    'Int',
    'Float',
    'Boolean',
    'ID'
];

let collectionName = null;
let documentID = null;

function getData(fieldName) {
    return collectionName + '/' + 'documentID' + '/' + fieldName;
    // return ['DB Data', fieldName];
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

        // !!! Important uncomment after tests
        // const jsonString = JSON.stringify(json);
        // if (jsonString.indexOf('type Query') === -1 || jsonString.indexOf('type Collection')) {
        //     throw new Error('Cannot find base objects');
        // }

        // let resolvers = {};
        // let collectionResolver = {};
        //
        //
        // resolvers['getCollections'] = collectionResolver;


        // Recursively add resolvers from lower down types to the higher ones
        // Maybe use a recursive function

        //
        // const types = Object.keys(json);
        //
        // for (const typeNo in types) {
        //     const typeName = types[typeNo];
        //     const type = json[typeName];
        // }

        let resolvers = {};
        let collectionResolvers = {};

        const customResolvers = getResolvers(json, 'type Document');

        // Make Collections and Documents iterable
        // Should be in these 2 functions
        collectionResolvers['getDocuments'] = function(args) {
            let documentMap = new Map();
            documentID = args._id;

            documentMap.set(documentID, customResolvers);

            return documentMap;
            // return customResolvers;
        };

        resolvers['getCollections'] = function(args) {
            let collectionMap = new Map();
            collectionName = args.name;

            collectionMap.set(collectionName, collectionResolvers);

            return collectionMap;
            // return collectionResolvers;
        };

        // return getResolvers(json, 'type Query');
        return resolvers;
    }
};
