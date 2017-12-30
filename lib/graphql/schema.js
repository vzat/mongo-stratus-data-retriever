// Generate Schemas from JSON
const logger = require('./../logger');

module.exports = {
    generate: function (json) {
        let schema = 'type ' + json.type + ' {\n';
        const fields = json.fields;

        for (const field in fields) {
            const params = fields[field].params;

            schema += '\t' + field;

            let paramsString = '';
            for (const param in params) {
                paramsString += param + ': ' + params[param] + ', ';
            }

            paramsString = '(' + paramsString.slice(0, -2) + ')';

            if (paramsString !== '()') {
                schema += paramsString;
            }

            schema += ': ' + fields[field].return + '\n';
        }

        schema += '}';

        return schema;
    }
};
