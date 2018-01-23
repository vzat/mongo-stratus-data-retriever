// Generate Resolvers from JSON
const logger = require('./../logger');

const tempDB = {
    'blogPosts': [{
        '_id': '123',
        'abc': 'firstabc',
        'qwe': {
            'test': 'firsttest',
            'test2': 'firsttest2'
        },
        'wasd': 'firstwasd'
    },
    {
        '_id': '1234',
        'abc': 'secondabc',
        'qwe': {
            'test': 'secondtest',
            'test2': 'secondtest2'
        },
        'wasd': 'secondwasd'
    },
    {
        '_id': '12345',
        'abc': 'thirdabc',
        'qwe': {
            'test': 'thirdtest',
            'test2': 'thirdtest2'
        },
        'wasd': 'thirdwasd'
    }],
};

const scalarTypes = [
    'String',
    'Int',
    'Float',
    'Boolean',
    'ID'
];

let collectionName = undefined;
let documentID = undefined;

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

            resolvers[fieldName] = function () {
                return getData(fieldName);
            };
        }
        else {
            let customScalar = field.return;
            if (customScalar.indexOf('!') !== -1) {
                customScalar = customScalar.slice(0, -1);
            }

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

        // Use collectionName and documentID to get the correct fields
        const customResolvers = getResolvers(json, 'type Document');

        // Make Documents iterable
        // Should be in these 2 functions
        collectionResolvers['getDocuments'] = function(args) {
            let documentMap = new Map();
            documentID = args._id;

            if (documentID === undefined) {
                // !!! Get from DB
                const currentCollection = tempDB[collectionName];

                for (const documentNo in currentCollection) {
                    const document = currentCollection[documentNo];
                    documentMap.set(document._id, customResolvers);
                }
            }
            else {
                documentMap.set(documentID, customResolvers);
            }

            return documentMap;
        };

        resolvers['getCollections'] = function(args) {
            let collectionMap = new Map();
            collectionName = args.name;

            // The name argument must always be specified

            // collectionMap.set(collectionName, collectionResolvers);

            // return collectionMap;
            return collectionResolvers;
        };

        // return getResolvers(json, 'type Query');
        return resolvers;
    }
};
