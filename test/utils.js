const expect = require('chai').expect;
const config = require('config');

const utils = require('../lib/utils');

describe('utils', () => {
    describe('getToken(auth)', () => {
        it('should remove Bearer from token', (done) => {
            // Arrange
            const initToken = 'Bearer a123';
            const correctToken = 'a123';

            // Act
            const token = utils.getToken(initToken);

            // Assert
            expect(token).to.be.equal(correctToken);

            done();
        });
    });

    describe('getUserFromUrl(url)', () => {
        it('should return the user', (done) => {
            const url = '/api/v1/jsmith/blog/posts';
            const user = 'jsmith';

            expect(utils.getUserFromUrl(url)).to.be.equal(user);

            done();
        });
    });

    describe('getServerFromUrl(url)', () => {
        it('should return the server', (done) => {
            const url = '/api/v1/jsmith/blog/posts';
            const server = 'blog';

            expect(utils.getServerFromUrl(url)).to.be.equal(server);

            done();
        });
    });

    describe('getDBFromUrl(url)', () => {
        it('should return the database', (done) => {
            const url = '/api/v1/jsmith/blog/posts';
            const db = 'posts';

            expect(utils.getDBFromUrl(url)).to.be.equal(db);

            done();
        });
    });

    describe('getSysDBInfo()', () => {
        it('should return system database connection info from config', (done) => {
            const sysDBInfo = utils.getSysDBInfo();

            expect(sysDBInfo.ip).to.be.equal(config.db.ip);
            expect(sysDBInfo.port).to.be.equal(config.db.port);
            expect(sysDBInfo.name).to.be.equal(config.db.name);

            done();
        });
    });

    describe('replaceString(str, rep, pos)', () => {
        it('should replace the string at position \'pos\' with \'rep\'', (done) => {
            const initString = 'Hello World!';
            const modifiedString = 'Hello World?';

            expect(utils.replaceString(initString, '?', 11)).to.be.equal(modifiedString);

            done();
        });
    });

    describe('toProperCase(name)', () => {
        it('should return the string in Proper Case', (done) => {
            const testString = 'this is a sentance with an_undescore';
            const properCase = 'This Is A Sentance With An_Undescore';

            expect(utils.toProperCase(testString)).to.be.equal(properCase);

            done();
        });
    });

    describe('isGraphQLScalar(scalar)', () => {
        it('should return boolean', (done) => {
            expect(utils.isGraphQLScalar('scalar')).to.be.a('boolean');

            done();
        });
    });
});
