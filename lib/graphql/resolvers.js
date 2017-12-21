// Generate Resolvers from JSON
const logger = require('./../logger');

module.exports = {
    generate: function (json) {
        let resolvers = {};
        const fields = json.fields;

        for (const field in fields) {
            // Change to function that returns data from the db
            resolvers[field] = function () {
                return 'DB ' + field;
            };
        }

        logger.log('info', '\n' + resolvers);

        return resolvers;
    }
};
