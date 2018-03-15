const expressGraphQL = require('express-graphql');
const { buildSchema } = require('graphql');

const graphqlSchema = require('./schema');
const graphqlResolvers = require('./resolvers');
const logger = require('../logger');
const authMiddleware = require('../authMiddleware');

module.exports = {
    createEndpoint: async function (app, rootEndpoint, userData, schemaData) {
        // userData
        // --> username: user,
        // --> server: server,
        // --> database: database,
        // --> token: token

        const schema = buildSchema(graphqlSchema.generate(schemaData));
        const rootValue = graphqlResolvers.generate(schemaData);

        const endpoint = rootEndpoint + userData.username + '/' + userData.server + '/' + userData.database;

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

        logger.log('info', 'The endpoint ' + endpoint + ' was created/changed');
    }
    // createServerEndpoint: async function (app, rootEndpoint, userData) {
    //     // userData
    //     // --> username: user,
    //     // --> server: server,
    //
    //     const endpoint = rootEndpoint + userData.username + '/' + userData.server;
    //     const schema = buildSchema(`
    //         type Query {
    //             getDatabases: [Database]
    //             createDatabase (name: String!): String
    //             dropDatabase (name: String!): String
    //             addUser (user: User!): User
    //             removeUser (username: String!): User
    //             ping: Boolean
    //         }
    //         input Database {
    //             name: String,
    //             size: Int
    //         }
    //         input User {
    //             username: String,
    //             password: String,
    //             role: String
    //         }
    //     `);
    //
    //     const rootValue = {
    //         getDatabases: () => {
    //             return db.getDatabases(userData.username, userData.server);
    //         },
    //         createDatabase: ({ name }) => {
    //             return db.createDatabase(userData.username, userData.server, name);
    //         },
    //         dropDatabase: ({ name }) => {
    //             return db.dropDatabase(userData.username, userData.server, name);
    //         }
    //     };
    //
    //     app.post(endpoint, authMiddleware, expressGraphQL({
    //         schema: schema,
    //         rootValue: rootValue
    //     }));
    // }
};
