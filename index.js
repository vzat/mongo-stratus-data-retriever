const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const OAuthServer = require('express-oauth-server');

const logger = require('./lib/logger');
const routes = require('./api/v1/routes');
const graphqlGenerator = require('./lib/graphql-generator');
const removeEndpoint = require('./lib/express-remove-endpoint');
const OAuth2Model = require('./models/OAuth2Models.js');

let app = express();

app.oauth = new OAuthServer({
    model: OAuth2Model
});

function getToken(data) {
    return 'abc123';
}

function getUser(token) {
    return 'john';
}

app.set('port', process.env.PORT || 5000);
app.use(cors());
app.use(bodyParser.json());
app.use(app.oauth.authorize());
app.use(morgan('combined'));

// Debug only
app.get('/', function (req, res) {
    res.end('Data Retriever');
});

routes.put('/:database/schema', function (req, res) {
    const database = req.params.database;
    const token = getToken(req.get('Authorization'));
    const schemaData = req.body.schema;

    const user = getUser(token);

    removeEndpoint(app, '/api/v1/' + user + '/' + database);

    graphqlGenerator.createEndpoint(app, '/api/v1/' + user + '/' + database, schemaData);

    res.setHeader('Content-Type', 'application/json');

    res.send(JSON.stringify({'error': 0}));
});

app.listen(app.get('port'), function () {
    logger.log('info', 'Data Retriever running on port ' + app.get('port'));

    app.use('/api/v1', routes);
});

// const db = require('./lib/db.js');

// db.connectSysDB().then(() => {
//     logger.log('info', 'After?');
//     // db.getDocument('mongodb://localhost:27017/mongoStratus', 'abc', '5a6ce262dbb5d8ce801f98f3', ['abc']);
//     // db.getDocuments('mongodb://localhost:27017/mongoStratus', 'abc', ['abc']);
//     const serverInfo = {
//         ip: 'localhost',
//         port: 27017,
//         name: 'mongoStratus'
//     }
//     db.getDocumentsv2(serverInfo, 'abc', {'abc': 'def'}, {'projection': {'abc': 1}});
// });

module.exports = app;
