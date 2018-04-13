const request = require('supertest');
const expect = require('chai').expect;

const app = require('../index');

let docid;

describe('API', () => {
    describe('REST', () => {

        describe('POST /api/v1/<user>/<instance>/<database>/collection', () => {
            it('should insert a new collection', (done) => {
                request(app)
                    .post('/api/v1/admin/mongoStratus/mongoStratus/collection')
                    .set('Authorization', 'Bearer z321')
                    .send({
                        collection: 'test-collection'
                    })
                    .end((err, res) => {
                        expect(err).to.equal(null);
                        expect(res.statusCode).to.equal(200);
                        expect(res).to.have.property('body');
                        expect(res.body).to.have.property('ok');
                        expect(res.body.ok).to.be.equal(1);
                        done();
                    });
            });
        });


        describe('POST /api/v1/<user>/<instance>/<database>/<collection>/documents', () => {
            it('should insert a document', (done) => {
                request(app)
                    .post('/api/v1/admin/mongoStratus/mongoStratus/test-collection/documents')
                    .set('Authorization', 'Bearer z321')
                    .send({
                        documents: [{
                            field1: 'data',
                            field2: 'data2',
                            field3: 'data3'
                        }]
                    })
                    .end((err, res) => {
                        expect(err).to.equal(null);
                        expect(res.statusCode).to.equal(200);
                        expect(res).to.have.property('body');
                        expect(res.body).to.have.property('ok');
                        expect(res.body.ok).to.be.equal(1);
                        done();
                    });
            });
        });

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
                        expect(res.body.data.length).to.be.above(0);
                        done();
                    });
            });
        });

        describe('GET /api/v1/<user>/<instance>/<database>/<collection>/documents', () => {
            it('should get all the documents from a collection', (done) => {
                request(app)
                    .get('/api/v1/admin/mongoStratus/mongoStratus/test-collection/documents')
                    .set('Authorization', 'Bearer z321')
                    .end((err, res) => {
                        expect(err).to.equal(null);
                        expect(res.statusCode).to.equal(200);
                        expect(res).to.have.property('body');
                        expect(res.body).to.have.property('ok');
                        expect(res.body.ok).to.be.equal(1);
                        expect(res.body).to.have.property('data');
                        expect(res.body.data.length).to.be.above(0);
                        docid = res.body.data[0]._id;
                        done();
                    });
            });
        });

        describe('PUT /api/v1/<user>/<instance>/<database>/<collection>/documents', () => {
            it('should modify a document', (done) => {
                request(app)
                    .put('/api/v1/admin/mongoStratus/mongoStratus/test-collection/documents')
                    .set('Authorization', 'Bearer z321')
                    .send({
                        ids: [docid],
                        documents: [{
                            field1: 'newdata',
                            field2: 'newdata2',
                            field3: 'newdata3'
                        }]
                    })
                    .end((err, res) => {
                        expect(err).to.equal(null);
                        expect(res.statusCode).to.equal(200);
                        expect(res).to.have.property('body');
                        expect(res.body).to.have.property('ok');
                        expect(res.body.ok).to.be.equal(1);
                        done();
                    });
            });
        });

        describe('DELETE /api/v1/<user>/<instance>/<database>/<collection>/documents', () => {
            it('should delete a document', (done) => {
                request(app)
                    .delete('/api/v1/admin/mongoStratus/mongoStratus/test-collection/documents')
                    .set('Authorization', 'Bearer z321')
                    .send({
                        ids: [docid]
                    })
                    .end((err, res) => {
                        expect(err).to.equal(null);
                        expect(res.statusCode).to.equal(200);
                        expect(res).to.have.property('body');
                        expect(res.body).to.have.property('ok');
                        expect(res.body.ok).to.be.equal(1);
                        done();
                    });
            });
        });

        describe('DELETE /api/v1/<user>/<instance>/<database>/collection', () => {
            it('should delete a collection', (done) => {
                request(app)
                    .delete('/api/v1/admin/mongoStratus/mongoStratus/collection')
                    .set('Authorization', 'Bearer z321')
                    .send({
                        collection: 'test-collection'
                    })
                    .end((err, res) => {
                        expect(err).to.equal(null);
                        expect(res.statusCode).to.equal(200);
                        expect(res).to.have.property('body');
                        expect(res.body).to.have.property('ok');
                        expect(res.body.ok).to.be.equal(1);
                        done();
                    });
            });
        });
    });

    describe('GraphQL', () => {
        describe('POST /api/v1/<user>', () => {
            it('should exist and contain Query operations', (done) => {
                request(app)
                    .post('/api/v1/admin')
                    .set('Authorization', 'Bearer z321')
                    .set('Content-Type', 'application/json')
                    .send({
                        query: `{
                          __type(name: "Query") {
                            name
                            fields {
                              name
                            }
                          }
                        }`
                    })
                    .end((err, res) => {
                        expect(err).to.equal(null);
                        expect(res.statusCode).to.equal(200);
                        expect(res).to.have.property('body');
                        expect(res.body).to.have.property('data');
                        expect(res.body.data).to.have.property('__type');
                        expect(res.body.data.__type).to.have.property('fields');
                        expect(res.body.data.__type.fields.length).to.be.above(0);
                        done();
                    });
            });
        });

        describe('POST /api/v1/<user>', () => {
            it('should exist and contain Mutation operations', (done) => {
                request(app)
                    .post('/api/v1/admin')
                    .set('Authorization', 'Bearer z321')
                    .set('Content-Type', 'application/json')
                    .send({
                        query: `{
                          __type(name: "Mutation") {
                            name
                            fields {
                              name
                            }
                          }
                        }`
                    })
                    .end((err, res) => {
                        expect(err).to.equal(null);
                        expect(res.statusCode).to.equal(200);
                        expect(res).to.have.property('body');
                        expect(res.body).to.have.property('data');
                        expect(res.body.data).to.have.property('__type');
                        expect(res.body.data.__type).to.have.property('fields');
                        expect(res.body.data.__type.fields.length).to.be.above(0);
                        done();
                    });
            });
        });

        describe('POST /api/v1/<user>/<instance>', () => {
            it('should exist and contain Query operations', (done) => {
                request(app)
                    .post('/api/v1/admin/mongoStratus')
                    .set('Authorization', 'Bearer z321')
                    .set('Content-Type', 'application/json')
                    .send({
                        query: `{
                          __type(name: "Query") {
                            name
                            fields {
                              name
                            }
                          }
                        }`
                    })
                    .end((err, res) => {
                        expect(err).to.equal(null);
                        expect(res.statusCode).to.equal(200);
                        expect(res).to.have.property('body');
                        expect(res.body).to.have.property('data');
                        expect(res.body.data).to.have.property('__type');
                        expect(res.body.data.__type).to.have.property('fields');
                        expect(res.body.data.__type.fields.length).to.be.above(0);
                        done();
                    });
            });
        });

        describe('POST /api/v1/<user>/<instance>', () => {
            it('should exist and contain Mutation operations', (done) => {
                request(app)
                    .post('/api/v1/admin/mongoStratus')
                    .set('Authorization', 'Bearer z321')
                    .set('Content-Type', 'application/json')
                    .send({
                        query: `{
                          __type(name: "Mutation") {
                            name
                            fields {
                              name
                            }
                          }
                        }`
                    })
                    .end((err, res) => {
                        expect(err).to.equal(null);
                        expect(res.statusCode).to.equal(200);
                        expect(res).to.have.property('body');
                        expect(res.body).to.have.property('data');
                        expect(res.body.data).to.have.property('__type');
                        expect(res.body.data.__type).to.have.property('fields');
                        expect(res.body.data.__type.fields.length).to.be.above(0);
                        done();
                    });
            });
        });
    });
});
