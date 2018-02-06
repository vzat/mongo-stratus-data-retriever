const expect = require('chai').expect;

const graphqlSchema = require('../lib/graphql-generator/schema.js');

const fakeSchema = {
    'Query': {
        'collection1': '[Collection1_Document]',
        'collection2': '[Collection2_Document]'
    },
    'Collection1_Document': {
        '_id': 'ID',
        'field1': 'String',
        'field2': 'Int',
        'field3': 'Test'
    },
    'Test': {
        'test1': 'String',
        'test2': 'String'
    },
    'Collection2_Document': {
        '_id': 'ID',
        'field9': 'Int',
        'field8': 'Boolean'
    }
};

const correctSchema =
`type Query {
\tgetCollection1(query: Collection1_DocumentInput_Root): [Collection1_Document]
\tgetCollection2(query: Collection2_DocumentInput_Root): [Collection2_Document]
}
type Collection1_Document {
\t_id: ID
\tfield1: String
\tfield2: Int
\tfield3: Test
}
type Test {
\ttest1: String
\ttest2: String
}
type Collection2_Document {
\t_id: ID
\tfield9: Int
\tfield8: Boolean
}
type Mutation {
\tinsertCollection1(docs: [Collection1_DocumentInput]): [Collection1_Document]
\tdeleteCollection1(filter: Collection1_DocumentInput_Root): [Collection1_Document]
\tupdateCollection1(filter: Collection1_DocumentInput_Root, update: Collection1_DocumentInput): [Collection1_Document]
\tinsertCollection2(docs: [Collection2_DocumentInput]): [Collection2_Document]
\tdeleteCollection2(filter: Collection2_DocumentInput_Root): [Collection2_Document]
\tupdateCollection2(filter: Collection2_DocumentInput_Root, update: Collection2_DocumentInput): [Collection2_Document]
}
input Collection1_DocumentInput {
\t_id: ID
\tfield1: String
\tfield2: Int
\tfield3: TestInput
}
input TestInput {
\ttest1: String
\ttest2: String
}
input Collection2_DocumentInput {
\t_id: ID
\tfield9: Int
\tfield8: Boolean
}
input Collection1_DocumentInput_Root {
\t_id: ID
\tfield1: String
\tfield2: Int
}
input TestInput_Root {
\ttest1: String
\ttest2: String
}
input Collection2_DocumentInput_Root {
\t_id: ID
\tfield9: Int
\tfield8: Boolean
}
`;

describe('GraphQL-Generator', () => {
    describe('schema.generate(json)', () => {
        it('should generate a valid GraphQL schema', () => {
            const schema = graphqlSchema.generate(fakeSchema);

            expect(schema).to.be.equal(correctSchema);
        });
    });
});
