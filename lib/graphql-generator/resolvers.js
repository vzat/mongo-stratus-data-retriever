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

function getData(reqData) {
    // !!! Get from DB
    const collection = tempDB[reqData.collectionName];

    for (const documentNo in collection) {
        const document = collection[documentNo];

        if (document._id === reqData.documentID) {
            let fieldContent = document;
            for (let i = 0 ; i < reqData.fields.length ; i++) {
                const fieldName = reqData.fields[i];
                fieldContent = fieldContent[fieldName];
            }

            // Stringify the JSON in case it contains multiple fields
            if (typeof fieldContent !== 'string') {
                fieldContent = JSON.stringify(fieldContent);
            }

            return fieldContent;
        }
    }

    return undefined;
}

async function getResolvers(json, typeName, reqData) {
    const jsonString = JSON.stringify(json);
    if (jsonString.indexOf(typeName) === -1) {
        throw new Error('Cannot find ' + typeName);
    }

    let resolvers = {};

    const objType = json[typeName];

    const fields = Object.keys(objType);
    for (const fieldNo in fields) {
        const fieldName = fields[fieldNo];
        const field = objType[fieldName];

        // Push the element of the field tree
        reqData.fields.push(fieldName);

        console.log('Current Field: ' + fieldName);

        // Check if it is a custom scalar
        if (field.return.indexOf('!') !== -1 && scalarTypes.includes(field.return.slice(0, -1)) ||
            scalarTypes.includes(field.return)) {

            let resData;
            try {
                resData = await getData(reqData);
            }
            catch(e) {
                logger.log('error', 'No Value Found');
            }

            // Should wait for this to finish
            resolvers[fieldName] = function () {
                return resData;
            };

            // Remove child field
            reqData.fields.pop();
        }
        else {
            let customScalar = field.return;
            if (customScalar.indexOf('!') !== -1) {
                customScalar = customScalar.slice(0, -1);
            }

            resolvers[fieldName] = await getResolvers(json, 'type ' + customScalar, reqData);

            // Remove parent field
            reqData.fields.pop();
        }
    }

    return resolvers;
}

module.exports = {
    generate: function (json) {
        const jsonString = JSON.stringify(json);
        if (jsonString.indexOf('type Query') === -1 || jsonString.indexOf('type Collection') === -1) {
            throw new Error('Cannot find base objects');
        }

        let collectionResolvers = {};
        collectionResolvers['documents'] = function(args) {
            let documentMap = new Map();
            documentID = args._id;

            if (documentID === undefined) {
                // !!! Get from DB
                const currentCollection = tempDB[collectionName];

                for (const documentNo in currentCollection) {
                    const document = currentCollection[documentNo];
                    documentID = document._id;

                    // Requested Data
                    let reqData = {
                        'collectionName': collectionName,
                        'documentID': documentID,
                        'fields': []
                    };

                    documentMap.set(documentID, getResolvers(json, 'type Document', reqData));
                }
            }
            else {
                // Requested Data
                let reqData = {
                    'collectionName': collectionName,
                    'documentID': documentID,
                    'fields': []
                };
                documentMap.set(documentID, getResolvers(json, 'type Document', reqData));
            }

            return documentMap;
        };

        let resolvers = {};
        resolvers['collection'] = function(args) {
            // The name argument is mandatory
            collectionName = args.name;
            return collectionResolvers;
        };

        return resolvers;
    }
};
