const MongoClient =  require('mongodb').MongoClient;
// const ObjectID = require('mongodb').ObjectID;

const logger = require('./logger.js');
const utils = require('./utils');

// MongoDB driver ^3.0.0
// this is a client
// use client.db(dbName) to get the db -> sysDB.db('mongoStatus')
let sysDB;

function connect (uri) {
    return MongoClient.connect(uri)
        .then(conn => {
            logger.log('info', 'Connected to ' + uri);
            return conn;
        })
        .catch(err => {
            logger.log('error', err);
        });
}

// dataReq
// "token"
// "databaseName"
async function getServerInfo (dataReq) {
    const docs = await this.getDocumentsSysDB('accounts', {'token': dataReq.token}, {'projection': {'databases': 1}});

    // no need to verify if the db is correct as it's already been done
    // in the authorization middleware

    const databases = docs[0].databases;
    for (const dbNo in databases) {
        const database = databases[dbNo];

        if (database.name === dataReq.databaseName) {
            return {
                ip: database.ip,
                port: database.port,
                name: database.name
            };
        }
    }

    return undefined;
}

function getURI (serverInfo) {
    return 'mongodb://' + serverInfo.ip + ':' + serverInfo.port + '/' + serverInfo.name;
}

module.exports = {
    connectSysDB: () => {
        const uri = getURI(utils.getSysDBInfo());

        return MongoClient.connect(uri)
            .then(conn => {
                sysDB = conn;
                logger.log('info', 'Connected to ' + uri);
            })
            .catch(err => {
                logger.log('error', err);
            });
    },
    // getDocument: async (uri, collectionName, documentID, fieldNames) => {
    //     try {
    //         let client = await connect(uri);
    //         const dbName = uri.substring(uri.lastIndexOf('/') + 1);
    //         const db = client.db(dbName);
    //         let collection = db.collection(collectionName);
    //
    //         // Projection based on the fields received
    //         let proj = {fields: {}};
    //         if (fieldNames !== undefined) {
    //             for (let i = 0 ; i < fieldNames.length ; i++) {
    //                 proj.fields[fieldNames[i]] = 1;
    //             }
    //         }
    //
    //         const doc = await collection.findOne({_id: ObjectID(documentID)}, proj);
    //
    //         client.close();
    //
    //         return doc;
    //     }
    //     catch (err) {
    //         logger.log('error', err);
    //         return err;
    //     }
    // },
    // getDocuments: async (uri, collectionName, fieldNames) => {
    //     try {
    //         let client = await connect(uri);
    //         const dbName = uri.substring(uri.lastIndexOf('/') + 1);
    //         const db = client.db(dbName);
    //         let collection = db.collection(collectionName);
    //
    //         // Projection based on the fields received
    //         let proj = {fields: {}};
    //         if (fieldNames !== undefined) {
    //             for (let i = 0 ; i < fieldNames.length ; i++) {
    //                 proj.fields[fieldNames[i]] = 1;
    //             }
    //         }
    //
    //         const docs = await collection.find({}, proj).toArray();
    //
    //         client.close();
    //
    //         return docs;
    //     }
    //     catch (err) {
    //         logger.log('error', err);
    //         return err;
    //     }
    // },
    // getDocumentsv1: async (serverInfo, collectionName, query, options) => {
    //     try {
    //         let client = await connect(getURI(serverInfo));
    //         const db = client.db(serverInfo.name);
    //         let collection = db.collection(collectionName);
    //
    //         const docs = await collection.find(query, options).toArray();
    //
    //         client.close();
    //
    //         return docs;
    //     }
    //     catch (err) {
    //         logger.log('error', err);
    //         return err;
    //     }
    // },
    getDocuments: async (dataReq, collectionName, query, options) => {
        try {
            const serverInfo = await getServerInfo();

            let client = await connect(getURI(serverInfo));
            const db = client.db(serverInfo.name);
            let collection = db.collection(collectionName);

            const docs = await collection.find(query, options).toArray();

            client.close();

            return docs;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    getDocumentsSysDB: async (collectionName, query, options) => {
        try {
            const db = sysDB.db(utils.getSysDBInfo().name);
            let collection = db.collection(collectionName);
            const docs = await collection.find(query, options).toArray();
            return docs;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    }
};
