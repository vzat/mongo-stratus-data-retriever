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

function getArgs (args, enableRegex) {
    let dbArgs = {};
    for (const argName in args) {
        const argValue = args[argName];

        if (argName === '_id') {
            dbArgs[argName] = ObjectID(argValue);
        }
        else if (typeof argValue === 'string' && enableRegex) {
            dbArgs[argName] = new RegExp(argValue);
        }
        else {
            dbArgs[argName] = argValue;
        }
    }

    return dbArgs;
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

                // Get Data
                const collectionNameGet = 'get' + utils.toProperCase(collectionName);
                resolvers[collectionNameGet] = function (args, context, reqFields) {
                    // Args will only return fields that are defined in the schema
                    const dbArgs = getArgs(args.query, true);

                    const proj = getCollectionProjection(reqFields, collectionNameGet);

                    const dataReq = {
                        databaseName: utils.getDBFromUrl(context.originalUrl),
                        token: utils.getToken(context.get('Authorization'))
                    };
                    return db.getDocuments(dataReq, collectionName, dbArgs, {projection: proj});
                };

                // Insert Data
                const collectionNameInsert = 'insert' + utils.toProperCase(collectionName);
                resolvers[collectionNameInsert] = function (args, context) {
                    if (Object.keys(args).length === 0) {
                        throw new Error ('No data to insert');
                    }

                    const dbArgs = getArgs(args.doc);

                    const dataReq = {
                        databaseName: utils.getDBFromUrl(context.originalUrl),
                        token: utils.getToken(context.get('Authorization'))
                    };
                    return db.insertDocument(dataReq, collectionName, dbArgs);
                };

                // Delete Data
                const collectionNameDelete = 'delete' + utils.toProperCase(collectionName);
                resolvers[collectionNameDelete] = function (args, context) {
                    if (Object.keys(args.filter).length === 0) {
                        throw new Error ('Cannot filter the documents');
                    }

                    const dbArgs = getArgs(args.filter, true);

                    const dataReq = {
                        databaseName: utils.getDBFromUrl(context.originalUrl),
                        token: utils.getToken(context.get('Authorization'))
                    };
                    return db.deleteDocument(dataReq, collectionName, dbArgs);
                };

                // Update Data
                const collectionNameUpdate = 'update' + utils.toProperCase(collectionName);
                resolvers[collectionNameUpdate] = function (args, context) {
                    if (Object.keys(args).length === 0) {
                        throw new Error ('Cannot filter of update the documents');
                    }
                    else if (args.filter === undefined || Object.keys(args.filter).length === 0) {
                        throw new Error ('Cannot filter the documents');
                    }
                    else if (args.update === undefined || Object.keys(args.update).length === 0) {
                        throw new Error ('No data to update');
                    }

                    const filter = getArgs(args.filter, true);
                    const update = getArgs(args.update);

                    const dataReq = {
                        databaseName: utils.getDBFromUrl(context.originalUrl),
                        token: utils.getToken(context.get('Authorization'))
                    };
                    return db.updateDocument(dataReq, collectionName, filter, update);
                };
            }

            return resolvers;
        }
        catch (e) {
            logger.log('error', e);
        }
    }
};
