const express = require('express');

const expressGraphQL = require('express-graphql');
const { buildSchema } = require('graphql');

const app = express();
const logger = require('./lib/logger');

const json =
{
    type: 'Query',
    fields: {
        test: {
            params: {},
            return: 'String'
        },
        test2: {
            params: {
                id: 'Int!',
                name: 'String'
            },
            return: '[String]!'
        }
    }
};

const graphqlSchema = require('./lib/graphql/schema');
const graphqlResolvers = require('./lib/graphql/resolvers');
const schema = buildSchema(graphqlSchema.generate(json));
const rootValue = graphqlResolvers.generate(json);

app.use('/graphql', expressGraphQL({
    schema: schema,
    rootValue: rootValue,
    graphiql: true
}));

app.listen(5000);
logger.log('info', 'Data Retriever running on port 5000');
