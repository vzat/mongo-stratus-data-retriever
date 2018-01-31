const expressGraphQL = require('express-graphql');
const { buildSchema } = require('graphql');

const graphqlSchema = require('./schema');
const graphqlResolvers = require('./resolvers');
const utils = require('../utils');
const db = require('../db');
const logger = require('../logger');

async function authMiddleware(req, res, next) {
    try {
        const token = utils.getToken(req.get('Authorization'));
        const url = req.originalUrl;
        const user = utils.getUserFromUrl(url);
        const database = utils.getDBFromUrl(url);

        const docs = await db.getDocuments('accounts', {'username': user}, {'projection': {'token': 1, 'databases': 1}});

        // Check if the user exists
        if (docs === undefined || docs.length < 1) {
            throw new Error('User not found');
        }

        // Get the user document
        const doc = docs[0];

        // Check if the token is valid
        if (doc.token !== token) {
            throw new Error('Incorrect token');
        }

        // Check if the database exists
        let validDB = false;
        for (const databaseNo in doc.databases) {
            const dbInfo = doc.databases[databaseNo];
            if (dbInfo.name === database) {
                validDB = true;
            }
        }

        if (!validDB) {
            throw new Error('Database not found');
        }

        // Valid user
        next();
    }
    catch (e) {
        logger.log('error', e);
        res.sendStatus(403);
    }
}

module.exports = {
    createEndpoint: function (app, rootEndpoint, userData, schemaData) {
        const schema = buildSchema(graphqlSchema.generate(schemaData));
        const rootValue = graphqlResolvers.generate(schemaData);

        const endpoint = rootEndpoint + userData.username + '/' + userData.database;

        // Disable GraphQL interface in production
        let enableGraphiql = true;
        if (process.env.NODE_ENV === 'production') {
            enableGraphiql = false;
        }

        // // Create routes
        // app.get(endpoint, validUser, expressGraphQL({
        //     schema: schema,
        //     rootValue: rootValue,
        //
        //     // Dev only
        //     graphiql: enableGraphiql
        // }));

        app.post(endpoint, authMiddleware, expressGraphQL({
            schema: schema,
            rootValue: rootValue,

            // Dev only
            graphiql: enableGraphiql
        }));


        // // Create routes
        // app.get(endpoint, expressGraphQL(async (req, res, params) => ({
        //     schema: schema,
        //     rootValue: rootValue,
        //
        //     // Dev only
        //     graphiql: enableGraphiql
        // })));
        //
        // app.post(endpoint, expressGraphQL(async (req, res, params) => ({
        //     schema: schema,
        //     rootValue: rootValue,
        //
        //     // Dev only
        //     graphiql: enableGraphiql
        // })));
    }
};
