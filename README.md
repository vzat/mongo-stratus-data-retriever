# mongo-stratus-data-retriever
MongoStratus Data Retriever Server

# API
{cName} -> Name of the Collection

{QDoc} -> Document containing only root fields (i.e. does not include fields with nested values)

{MDoc} -> Document containing all the elements, including nested values


| Command | Returns | Description |
| :------ | :------ | :---------- |
| `get{CName} (query: {QDoc})` | [{MDoc]] | Returns multiple Documents based on the `query` |
| `insert{CName} (doc: [{MDoc}])` | [{MDoc}] | Inserts multiple Documents and returns them |
| `delete{CName} (filter: {QDoc})` | [{MDoc}] | Removes multiple Documents and returns them |
| `update{CName} (filter: {QDoc}, update: {MDoc))` | [{MDoc}] | Updates multiple Documents and returns the Documents in their initial state |
