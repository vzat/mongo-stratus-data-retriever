// Generate Schemas from JSON
const logger = require('./../logger');

module.exports = {
    generate: function (json) {
        let schema = "";

        const types = Object.keys(json);
        for (const typeNo in types) {
            const typeName = types[typeNo];
            const type = json[typeName];
            schema += typeName + ' {\n';

            const fields = Object.keys(type);
            for (const fieldNo in fields) {
                const fieldName = fields[fieldNo];
                const field = type[fieldName];
                schema += '\t' + fieldName;

                const params = field.params;
                let paramsString = '';
                for (const param in params) {
                    paramsString += param + ': ' + params[param] + ', ';
                }

                paramsString = '(' + paramsString.slice(0, -2) + ')';

                if (paramsString !== '()') {
                    schema += paramsString;
                }

                schema += ': ' + field.return + '\n';
            }

            schema += '}\n';
        }

        return schema;
    }
};
