const express = require('express');
const expressGraphQL = require('express-graphql');
const { buildSchema } = require('graphql');

const expressAPI = require('../../lib/express-api.js');
const graphqlSchema = require('../../lib/graphql/schema');
const graphqlResolvers = require('../../lib/graphql/resolvers');
const logger = require('../../lib/logger');

const router = express.Router();

function getToken(data) {
    return 'abc123';
}

function getUser(token) {
    return 'john';
}

// router.put('/:database/schema', function (req, res) {
//     const database = req.params.database;
//     const token = getToken(req.get('Authorization'));
//     const data = req.body.schema;
//
//     logger.log('info', data);
//
//     const user = getUser(token);
//
//     logger.log('info', expressAPI.get('port'));
//
//     const schema = buildSchema(graphqlSchema.generate(data));
//     const rootValue = graphqlResolvers.generate(data);
//
//     expressAPI.use('/' + user + '/' + database, expressGraphQL({
//         schema: schema,
//         rootValue: rootValue,
//
//         // Debug only
//         graphiql: true
//     }));
//
//     res.setHeader('Content-Type', 'application/json');
//
//     res.send(JSON.stringify({'error': 0}));
// });

module.exports = router;
