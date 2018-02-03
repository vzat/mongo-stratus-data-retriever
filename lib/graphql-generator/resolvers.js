// Generate Resolvers from JSON
const logger = require('../logger');
const db = require('../db');
const utils = require('../utils');
const ObjectID = require('mongodb').ObjectID;

function getCollectionProjection (reqFields, collectionName) {
    if (reqFields === undefined ||
        reqFields.operation === undefined ||
        reqFields.operation.selectionSet === undefined ||
        reqFields.operation.selectionSet.selections === undefined) {

        throw new Error ('No fields found');
    }

    for (const collectionNo in reqFields.operation.selectionSet.selections) {
        const collectionSelection = reqFields.operation.selectionSet.selections[collectionNo];

        if (collectionSelection.name.value === collectionName) {
            const proj = {};
            for (const fieldNo in collectionSelection.selectionSet.selections) {
                const fieldSelection = collectionSelection.selectionSet.selections[fieldNo];
                proj[fieldSelection.name.value] = 1;
            }
            return proj;
        }
    }

    return undefined;
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
                const collectionNameGet = 'get' + utils.toProperCase(collectionName);

                // Get Data
                resolvers[collectionNameGet] = function (args, context, reqFields) {
                    // Args will only return fields that are defined in the schema
                    let dbArgs = {};
                    for (const argName in args) {
                        const argValue = args[argName];

                        if (typeof argValue === 'string' && argName !== '_id') {
                            dbArgs[argName] = new RegExp(argValue);
                        }
                        else {
                            if (argName === '_id') {
                                dbArgs[argName] = ObjectID(argValue);
                            }
                            else {
                                dbArgs[argName] = argValue;
                            }
                        }
                    }

                    const proj = getCollectionProjection(reqFields, collectionNameGet);

                    const dataReq = {
                        databaseName: utils.getDBFromUrl(context.originalUrl),
                        token: utils.getToken(context.get('Authorization'))
                    };
                    return db.getDocuments(dataReq, collectionName, dbArgs, {projection: proj});
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
