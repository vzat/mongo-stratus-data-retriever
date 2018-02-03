const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const logger = require('./lib/logger');
const routes = require('./api/v1/routes');
const graphqlGenerator = require('./lib/graphql-generator');
const removeEndpoint = require('./lib/express-remove-endpoint');
const utils = require('./lib/utils');
const db = require('./lib/db');
const authMiddleware = require('./lib/authMiddleware');

let app = express();

// async function getUser (token) {
//     const docs = await db.getDocumentsSysDB('accounts', {'token': token}, {'projection': {'username': 1}});
//
//     if (docs !== undefined && docs.length === 1) {
//         return docs[0].username;
//     }
//
//     return undefined;
// }

db.connectSysDB();

app.set('port', process.env.PORT || 5000);
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('combined'));

// Debug only
app.get('/', function (req, res) {
    res.end('Data Retriever');
});

routes.put('/:user/:database/schema', authMiddleware, async function (req, res) {
    res.setHeader('Content-Type', 'application/json');

    try {
        const database = req.params.database;
        const user = req.params.user;
        const token = utils.getToken(req.get('Authorization'));
        const schemaData = req.body.schema;

        // const user = await getUser(token);

        removeEndpoint(app, '/api/v1/' + user + '/' + database);

        const userData = {
            username: user,
            database: database,
            token: token
        };

        graphqlGenerator.createEndpoint(app, '/api/v1/', userData, schemaData);

        res.send(JSON.stringify({'error': 0}));
    }
    catch (e) {
        logger.log('error', e);
        res.send(JSON.stringify({'error': 1, 'errorMessage': e}));
    }
});

// TODO: Add endpoint to change the API token

app.use('/api/v1', routes);

app.listen(app.get('port'), function () {
    logger.log('info', 'Data Retriever running on port ' + app.get('port'));
});



// Testing new resolver generating functions
// const tempSchema = {
//     "Query": {
//         "collection1": "[Collection1.Document]",
//         "collection2": "[Collection2.Document]"
//     },
//     "Collection1.Document": {
//         "_id": "ID",
//         "field1": "String",
//         "field2": "Int",
//         "field3": "Test"
//     },
//     "Test": {
//         "test1": "String",
//         "test2": "String"
//     },
//     "Collection2.Document": {
//         "_id": "ID",
//         "field9": "Int",
//         "field8": "Boolean"
//     }
// };

// const resolversv2 = require('./lib/graphql-generator/resolversv2');
// resolversv2.generate(tempSchema);


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

// const utils = require('./lib/utils');
// console.log(utils.getDBFromUrl('/api/v1/john/abc'));

module.exports = app;
