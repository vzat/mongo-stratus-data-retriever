const expressGraphQL = require('express-graphql');
const { buildSchema } = require('graphql');

const graphqlSchema = require('./schema');
const graphqlResolvers = require('./resolvers');

module.exports = {
    createEndpoint: function (app, endpoint, schemaData) {
        const schema = buildSchema(graphqlSchema.generate(schemaData));
        const rootValue = graphqlResolvers.generate(schemaData);

        // Disable GraphQL interface in production
        let enableGraphiql = true;
        if (process.env.NODE_ENV === 'production') {
            enableGraphiql = false;
        }

        // Create routes
        app.get(endpoint, expressGraphQL({
            schema: schema,
            rootValue: rootValue,

            // Dev only
            graphiql: enableGraphiql
        }));

        app.post(endpoint, expressGraphQL({
            schema: schema,
            rootValue: rootValue,

            // Dev only
            graphiql: enableGraphiql
        }));
    }
};
