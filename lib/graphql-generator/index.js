const expressGraphQL = require('express-graphql');
const { buildSchema } = require('graphql');

const graphqlSchema = require('./schema');
const graphqlResolvers = require('./resolvers');

function authMiddleware(req, res, next) {
    // Check if token matches user
    // Check if database exists

    const token = req.get('Authorization');
    const url = req.originalUrl();

    if (req.get('Authorization') === 'Bearer a123') {
        return next();
    }
    res.sendStatus(403);
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
