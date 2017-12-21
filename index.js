const express = require('express');
const app = express();

const expressGraphQL = require('express-graphql');
const { buildSchema } = require('graphql');

const fs = require('fs');

const logger = require('./lib/logger');

function generateSchema(typeName) {
    let schema = 'type ' + typeName + ' {\n';

    schema += '\thello: String\n';

    schema += '}'

    return buildSchema(schema);
}

function generateRoot() {
    let root = {};

    root['hello'] = function () {
        return 'Hello World';
    }

    return root;
}

const schema = generateSchema('Query');
const rootValue = generateRoot();

app.use('/graphql', expressGraphQL(async (req, res, params) => ({
    schema: schema,
    rootValue: rootValue,
    graphiql: true
})));

app.listen(5000);
console.log('Data Retriever running on port 5000');

logger.log('info', 'dadasczx');
