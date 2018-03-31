const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cron = require('node-cron');
const request = require('request-promise');

let app = express();

const logger = require('./lib/logger');
const routes = require('./api/v1/routes')(app);
const db = require('./lib/db');
const graphqlGenerator = require('./lib/graphql-generator');

db.connectSysDB().then(async () => {
    app.set('port', process.env.PORT || 5000);
    app.use(cors());
    app.use(bodyParser.json());
    app.use(morgan('combined'));

    // Debug only
    app.get('/', function (req, res) {
        res.end('Data Retriever');
    });

    app.use('/api/v1', routes);

    app.listen(app.get('port'), function () {
        logger.log('info', 'Data Retriever running on port ' + app.get('port'));
    });

    const docs = await db.getDocumentsSysDB('accounts', {}, {'projection': {'username': 1, 'token': 1, 'databases': 1}});

    for (const docNo in docs) {
        const doc = docs[docNo];

        const databases = doc.databases;
        if (databases !== undefined && databases.length > 0) {
            for (const dbNo in databases) {
                const database = databases[dbNo];

                if (database.schema !== undefined && database.schema !== null && database.schema !== '') {
                    const schemaData = await JSON.parse(database.schema);

                    const userData = {
                        username: doc['username'],
                        server: database.serverName,
                        database: database.name,
                        token: doc.token
                    };
                    graphqlGenerator.createEndpoint(app, '/api/v1/', userData, schemaData);
                }

            }
        }
    }

    logger.log('info', 'API endpoints have been restored');

    // Backup Scheduled Instances
    cron.schedule('0 * * * *', async () => {
        const docs = await db.getDocumentsSysDB('backups', {}, {'projection': {'username': 1, 'instance': 1, 'time': 1}});
        for (const docNo in docs) {
            const doc = docs[docNo];

            const comp = doc.time.split(' ');
            if (doc.time !== '* * * * *' && comp.length === 5) {
                let backup = false;
                const currentDate = new Date();

                if (comp[1] == currentDate.getHours()) {
                    // Daily
                    if (comp[2] == '*' && comp[4] == '*') {
                        backup = true;
                    }

                    // Weekly
                    if (comp[4] == currentDate.getDay()) {
                        backup = true;
                    }

                    // Monthly
                    if (comp[2] == currentDate.getDate()) {
                        backup = true;
                    }
                }

                if (backup === true) {
                    const accounts = await db.getDocumentsSysDB('accounts', {'username': doc.username}, {'projection': {'username': 1, 'token': 1}});

                    if (accounts[0].username === doc.username) {
                        const mutation = `mutation Backup {
                            backup
                        }`;

                        let options = {
                            method: 'POST',
                            uri: 'http://localhost:5000' + '/api/v1/' + doc.username + '/' + doc.instance,
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + accounts[0].token
                            },
                            body: JSON.stringify({
                                query: mutation
                            })
                        };

                        request.post(options);

                        logger.log('info', 'Backing up ' + doc.username + '\'s instance ' + doc.instance);
                    }
                }
            }
        }
    });
});

module.exports = app;
