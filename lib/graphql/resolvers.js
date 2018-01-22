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

        return resolvers;
    },
    generatev2: function (json) {
        // let resolvers = {};
        //
        // for (const type in json) {
        //     const typeData = json[type];
        //
        //     logger.log('info', type);
        //     logger.log('info', typeData);
        // }



        // let resolvers = {};
        //
        // let test = {};
        // test['abc'] = function () {
        //     return 'DB abc';
        // }
        // test['wasd'] = function () {
        //     return 'DB wasd';
        // }
        //
        // resolvers['test'] = test;
        // resolvers['test2'] = function () {
        //     return 'DB test2';
        // }
        //
        // return resolvers;

        
    }
};
