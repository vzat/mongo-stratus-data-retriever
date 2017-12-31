const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const expressGraphQL = require('express-graphql');
const { buildSchema } = require('graphql');
const removeRoute = require('express-remove-route');
const request = require('request-promise');

const logger = require('./lib/logger');
const routes = require('./api/v1/routes');
const graphqlSchema = require('./lib/graphql/schema');
const graphqlResolvers = require('./lib//graphql/resolvers');

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

    const user = getUser(token);

    const schema = buildSchema(graphqlSchema.generate(data));
    const rootValue = graphqlResolvers.generate(data);

    for (let routeNo = 0 ; routeNo < app._router.stack.length ; routeNo++) {
        const routes = app._router.stack[routeNo];

        if (routes.route !== undefined &&
            routes.route.path === '/api/v1/' + user + '/' + database) {

            app._router.stack.splice(routeNo, 1);
            routeNo--;
        }
    }

    app.get('/api/v1/' + user + '/' + database, expressGraphQL({
        schema: schema,
        rootValue: rootValue,

        // Debug only
        graphiql: true
    }));

    app.post('/api/v1/' + user + '/' + database, expressGraphQL({
        schema: schema,
        rootValue: rootValue,

        // Debug only
        graphiql: true
    }));

    res.setHeader('Content-Type', 'application/json');

    res.send(JSON.stringify({'error': 0}));

    // const options = {
    //     method: 'GET',
    //     uri: 'http://localhost:' + app.get('port') + '/api/v1/' + user + '/' + database,
    // };
    //
    // new Promise(function (resolve, reject) {
    //     request(options)
    //         .then(function (body) {
    //             logger.log('info', body.statusCode);
    //         })
    //         .catch(function (err) {
    //             logger.log('info', err.statusCode);
    //
    //             if (err.statusCode == 404) {
    //                 resolve();
    //             }
    //         });
    // });

    // app.use('/api/v1/' + user + '/' + database, expressGraphQL({
    //     schema: schema,
    //     rootValue: rootValue,
    //
    //     // Debug only
    //     graphiql: true
    // }));
    //
    // res.setHeader('Content-Type', 'application/json');
    //
    // res.send(JSON.stringify({'error': 0}));
});

app.listen(app.get('port'), function () {
    logger.log('info', 'Data Retriever running on port ' + app.get('port'));

    app.use('/api/v1', routes);
});

module.exports = app;
