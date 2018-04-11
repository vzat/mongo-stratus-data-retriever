const request = require('supertest');
const expect = require('chai').expect;

const app = require('../index');

describe('API', () => {
    describe('REST', () => {
        describe('GET /api/v1/<user>/<instance>/databases', () => {
            it('should get all the databases', (done) => {
                request(app)
                    .get('/api/v1/admin/mongoStratus/databases')
                    .set('Authorization', 'Bearer z321')
                    .end((err, res) => {
                        expect(err).to.equal(null);
                        expect(res.statusCode).to.equal(200);
                        expect(res).to.have.property('body');
                        expect(res.body).to.have.property('ok');
                        expect(res.body.ok).to.be.equal(1);
                        expect(res.body).to.have.property('data');
                        expect(res.body.data.length).to.be.above(2);
                        done();
                    });
            });
        });

        describe('GET /api/v1/<user>/<instance>/<database>/collections', () => {
            it('should get all the collections from a database', (done) => {
                request(app)
                    .get('/api/v1/admin/mongoStratus/mongoStratus/collections')
                    .set('Authorization', 'Bearer z321')
                    .end((err, res) => {
                        expect(err).to.equal(null);
                        expect(res.statusCode).to.equal(200);
                        expect(res).to.have.property('body');
                        expect(res.body).to.have.property('ok');
                        expect(res.body.ok).to.be.equal(1);
                        expect(res.body).to.have.property('data');
                        expect(res.body.data.length).to.be.above(1);
                        done();
                    });
            });
        });
    });
});
