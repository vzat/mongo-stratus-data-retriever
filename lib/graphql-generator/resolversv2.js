// Generate Resolvers from JSON
const logger = require('../logger');
const db = require('../db');
const utils = require('../utils');

const scalarTypes = [
    'String',
    'Int',
    'Float',
    'Boolean',
    'ID'
];

// // Get all the root fields for a collection
// // that are standard scalars
// function getCollectionFields(json, collectionName) {
//     const collection = json[collectionName];
//     let fields = {};
//
//     for (const fieldName in collection) {
//         const fieldScalar = collection[fieldName];
//
//
//     }
// }

// function getCollectionResolvers () {
//
// }

function getCollectionFields (reqFields, collectionName) {
    // Check if reqFields.operation array has the collectionName
    console.log('reqFields', reqFields.operation.selectionSet.selections);
}

module.exports = {
    generate: function (json) {
        try {
            const jsonString = JSON.stringify(json);

            if (jsonString.indexOf('Query') === -1) {
                throw new Error('Cannot find Query');
            }

            let resolvers = {};

            const query = json['Query'];
            for (const collectionName in query) {
                const collectionType = query[collectionName];

                console.log('get' + utils.toProperCase(collectionName));

                // Get Data
                resolvers['get' + utils.toProperCase(collectionName)] = function (args, context, reqFields) {
                    let collectionResolvers = {};

                    // Documents

                    // Get all the root fields for a collection
                    // that are standard scalars

                    const cType = collectionType.replace(/[|]/g, '');
                    if (jsonString.indexOf(cType) === -1) {
                        throw new Error ('Cannot find ' + cType);
                    }

                    const fields = getCollectionFields(reqFields); // Array?

                    console.log('args', args);
                    // console.log('reqFields', reqFields.operation.selectionSet.selections[0].selectionSet.selections);
                    console.log('reqFields', reqFields.operation.selectionSet.selections);

                    // const collection = json[collectionName];
                    // let fields = {};
                    //
                    // for (const fieldName in collection) {
                    //     const fieldScalar = collection[fieldName];
                    //
                    //
                    // }

                    return collectionResolvers;
                };

                // TODO: Set Data
            }

            return resolvers;
        }
        catch (e) {
            logger.log('error', e);
        }
    }
};
