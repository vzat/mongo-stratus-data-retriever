const request = require('supertest');
const expect = require('chai').expect;

const app = require('../../index');

describe('API', () => {
    describe('REST', () => {
        describe('GET /api/v1/<user>/<instance>/databases', () => {
            it('should get all the databases', (done) => {
                request(app)
                    .get('/api/v1/admin/mongoStratus/databases')
                    .set('Authorization', 'Bearer z321')
                    .end((err, res) => {
                        console.log(err);
                        console.log(res.body);
                        expect(err).to.equal(null);
                        expect(res.statusCode).to.equal(200);
                        expect(res).to.have.property('body');
                        expect(res.body).to.have.property('ok');
                        expect(res.body).to.have.property('data');
                        done();
                    });
            });
        });
    });
});
