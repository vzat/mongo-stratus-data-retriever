const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');

let app = express();

const logger = require('./lib/logger');
const routes = require('./api/v1/routes')(app);
const db = require('./lib/db');

db.connectSysDB();

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

module.exports = app;
