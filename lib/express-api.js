const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const expressGraphQL = require('express-graphql');
const { buildSchema } = require('graphql');

const logger = require('./logger');
const routes = require('../api/v1/routes');
const graphqlSchema = require('./graphql/schema');
const graphqlResolvers = require('./graphql/resolvers');

const app = express();

function getToken(data) {
    return 'abc123';
}

function getUser(token) {
    return 'john';
}

app.set('port', process.env.PORT || 5000);
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('combined'));

// Debug only
app.get('/', function (req, res) {
    res.end('Data Retriever');
});

routes.put('/:database/schema', function (req, res) {
    const database = req.params.database;
    const token = getToken(req.get('Authorization'));
    const data = req.body.schema;

    logger.log('info', data);

    const user = getUser(token);

    const schema = buildSchema(graphqlSchema.generate(data));
    const rootValue = graphqlResolvers.generate(data);

    app.use('/' + user + '/' + database, expressGraphQL({
        schema: schema,
        rootValue: rootValue,

        // Debug only
        graphiql: true
    }));

    res.setHeader('Content-Type', 'application/json');

    res.send(JSON.stringify({'error': 0}));
});

app.listen(app.get('port'), function () {
    logger.log('info', 'Data Retriever running on port ' + app.get('port'));

    app.use('/api/v1', routes);
});


// !!! Move thid back into inde.js
// Put the functions (getToken, getUser) in a place were both index.js and routes can access
module.exports = app;
