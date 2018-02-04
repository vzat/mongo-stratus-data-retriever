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
    const docs = await dbFunc.getDocumentsSysDB('accounts', {'token': dataReq.token}, {'projection': {'databases': 1}});

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

const dbFunc = {
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
    getDocuments: async (dataReq, collectionName, query, options) => {
        try {
            const serverInfo = await getServerInfo(dataReq);

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
    },
    insertDocument: async (dataReq, collectionName, doc) => {
        try {
            const serverInfo = await getServerInfo(dataReq);

            let client = await connect(getURI(serverInfo));
            const db = client.db(serverInfo.name);
            let collection = db.collection(collectionName);

            await collection.insertOne(doc);

            client.close();

            return doc;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    insertDocumentSysDB: async (collectionName, doc) => {
        try {
            const db = sysDB.db(utils.getSysDBInfo().name);
            let collection = db.collection(collectionName);
            await collection.insertOne(doc);
            return doc;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    deleteDocument: async (dataReq, collectionName, filter, options) => {
        try {
            const serverInfo = await getServerInfo(dataReq);

            let client = await connect(getURI(serverInfo));
            const db = client.db(serverInfo.name);
            let collection = db.collection(collectionName);

            const deletedDoc = await collection.findOneAndDelete(filter, options);

            client.close();

            return deletedDoc.value;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    updateDocument: async (dataReq, collectionName, filter, update, options) => {
        try {
            const serverInfo = await getServerInfo(dataReq);

            let client = await connect(getURI(serverInfo));
            const db = client.db(serverInfo.name);
            let collection = db.collection(collectionName);

            const updatedDoc = await collection.findOneAndUpdate(filter, update, options);

            client.close();

            return updatedDoc.value;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    updateDocumentSysDB: async (collectionName, filter, update, options) => {
        try {
            const db = sysDB.db(utils.getSysDBInfo().name);
            let collection = db.collection(collectionName);
            const updatedDoc = await collection.findOneAndUpdate(filter, update, options);
            return updatedDoc.value;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
};

module.exports = dbFunc;
