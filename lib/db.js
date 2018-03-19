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
// "serverName"
// "databaseName"
async function getServerInfo (dataReq) {
    const docs = await dbFunc.getDocumentsSysDB('accounts', {'token': dataReq.token}, {'projection': {'databases': 1}});

    // no need to verify if the db is correct as it's already been done
    // in the authorization middleware

    const databases = docs[0].databases;
    for (const dbNo in databases) {
        const database = databases[dbNo];

        //  && database.name === dataReq.databaseName

        if (database.serverName === dataReq.serverName) {
            if (database.users && database.users.length > 0) {
                return {
                    ip: database.ip,
                    port: database.port,
                    name: dataReq.databaseName,
                    rootUser: database.users[0].username,
                    rootPass: database.users[0].password
                };
            }

            // For backwards compatability
            return {
                ip: database.ip,
                port: database.port,
                name: dataReq.databaseName
            };
        }
    }

    return undefined;
}

function getURI (serverInfo) {
    if (serverInfo.rootUser && serverInfo.rootPass) {
        return 'mongodb://' + serverInfo.rootUser + ':' + serverInfo.rootPass + '@' + serverInfo.ip + ':' + serverInfo.port + '/' + serverInfo.name;
    }
    return 'mongodb://' + serverInfo.ip + ':' + serverInfo.port + '/' + serverInfo.name;
}

const dbFunc = module.exports = {
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
    insertDocuments: async (dataReq, collectionName, docs) => {
        try {
            const serverInfo = await getServerInfo(dataReq);

            let client = await connect(getURI(serverInfo));
            const db = client.db(serverInfo.name);
            let collection = db.collection(collectionName);

            await collection.insertMany(docs);

            client.close();

            return docs;
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
    deleteDocuments: async (dataReq, collectionName, filter, options) => {
        try {
            const serverInfo = await getServerInfo(dataReq);

            let client = await connect(getURI(serverInfo));
            const db = client.db(serverInfo.name);
            let collection = db.collection(collectionName);

            const docs = await collection.find(filter, options).toArray();

            if (docs.length > 0) {
                await collection.deleteMany(filter, options);
            }

            client.close();

            return docs;
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
    updateDocuments: async (dataReq, collectionName, filter, update, options) => {
        try {
            const serverInfo = await getServerInfo(dataReq);

            let client = await connect(getURI(serverInfo));
            const db = client.db(serverInfo.name);
            let collection = db.collection(collectionName);

            const docs = await collection.find(filter, options).toArray();

            if (docs.length > 0) {
                await collection.updateMany(filter, {$set: update}, options);
            }

            client.close();

            return docs;
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
    getDatabases: async (dataReq) => {
        try {
            const serverInfo = await getServerInfo(dataReq);

            let client = await connect(getURI(serverInfo));
            const db = client.db(serverInfo.name);

            const res = await db.admin().listDatabases();

            client.close();

            return res.databases;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    createDatabase: async (dataReq) => {
        try {
            const serverInfo = await getServerInfo(dataReq);

            let client = await connect(getURI(serverInfo));
            const db = client.db(serverInfo.name);

            await db.createCollection('test');

            client.close();

            return dataReq.databaseName;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    dropDatabase: async (dataReq) => {
        try {
            const serverInfo = await getServerInfo(dataReq);

            let client = await connect(getURI(serverInfo));
            const db = client.db(serverInfo.name);

            await db.dropDatabase();

            client.close();

            return dataReq.databaseName;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    getUsers: async (dataReq) => {
        try {
            const serverInfo = await getServerInfo(dataReq);

            let client = await connect(getURI(serverInfo));
            const db = client.db(serverInfo.name);
            let collection = db.collection('system.users');

            const docs = await collection.find({}, { user: 1, db: 1, roles: 1}).toArray();

            client.close();

            let users = [];
            for (const docNo in docs) {
                const doc = docs[docNo];

                let roles = [];
                for (const roleNo in doc.roles) {
                    const role = doc.roles[roleNo];

                    roles.push(role.role);
                }

                const user = {
                    username: doc.user,
                    database: doc.db,
                    roles: roles
                };

                users.push(user);
            }

            return users;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    addUser: async (dataReq, user) => {
        try {
            const serverInfo = await getServerInfo(dataReq);

            let client = await connect(getURI(serverInfo));
            const db = client.db(serverInfo.name);

            await db.addUser(user.username, user.password, {roles: user.roles});

            client.close();

            return user.username;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    removeUser: async (dataReq, username) => {
        try {
            const serverInfo = await getServerInfo(dataReq);

            let client = await connect(getURI(serverInfo));
            const db = client.db(serverInfo.name);

            await db.removeUser(username);

            client.close();

            return username;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    ping: async (dataReq) => {
        try {
            const serverInfo = await getServerInfo(dataReq);

            let client = await connect(getURI(serverInfo));
            const db = client.db(serverInfo.name);

            const res = await db.admin().ping();

            client.close();

            if (res.ok && res.ok === 1) {
                return true;
            }

            return false;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    }
};
