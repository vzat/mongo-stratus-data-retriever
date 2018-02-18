const expect = require('chai').expect;
const config = require('config');

const utils = require('../lib/utils');

describe('utils', () => {
    describe('getToken(auth)', () => {
        it('should remove Bearer from token', () => {
            // Arrange
            const initToken = 'Bearer a123';
            const correctToken = 'a123';

            // Act
            const token = utils.getToken(initToken);

            // Assert
            expect(token).to.be.equal(correctToken);
        });
    });

    describe('getUserFromUrl(url)', () => {
        it('should return the user', () => {
            const url = '/api/v1/jsmith/blog/posts';
            const user = 'jsmith';

            expect(utils.getUserFromUrl(url)).to.be.equal(user);
        });
    });

    describe('getServerFromUrl(url)', () => {
        it('should return the server', () => {
            const url = '/api/v1/jsmith/blog/posts';
            const server = 'blog';

            expect(utils.getServerFromUrl(url)).to.be.equal(server);
        });
    });

    describe('getDBFromUrl(url)', () => {
        it('should return the database', () => {
            const url = '/api/v1/jsmith/blog/posts';
            const db = 'posts';

            expect(utils.getDBFromUrl(url)).to.be.equal(db);
        });
    });

    describe('getSysDBInfo()', () => {
        it('should return system database connection info from config', () => {
            const sysDBInfo = utils.getSysDBInfo();

            expect(sysDBInfo.ip).to.be.equal(config.db.ip);
            expect(sysDBInfo.port).to.be.equal(config.db.port);
            expect(sysDBInfo.name).to.be.equal(config.db.name);
        });
    });

    describe('replaceString(str, rep, pos)', () => {
        it('should replace the string at position \'pos\' with \'rep\'', () => {
            const initString = 'Hello World!';
            const modifiedString = 'Hello World?';

            expect(utils.replaceString(initString, '?', 11)).to.be.equal(modifiedString);
        });
    });

    describe('toProperCase(name)', () => {
        it('should return the string in Proper Case', () => {
            const testString = 'this is a sentance with an_undescore';
            const properCase = 'This Is A Sentance With An_Undescore';

            expect(utils.toProperCase(testString)).to.be.equal(properCase);
        });
    });

    describe('isGraphQLScalar(scalar)', () => {
        it('should return boolean', () => {
            expect(utils.isGraphQLScalar('scalar')).to.be.a('boolean');
        });
    });
});
