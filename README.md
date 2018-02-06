# mongo-stratus-data-retriever
MongoStratus Data Retriever Server

# API
{cName} -> Name of the Collection

{QDoc} -> Document containing only root fields (i.e. does not include fields with nested values)

{MDoc} -> Document containing all the elements, including nested values


| Command | Returns | Description |
| :------ | :------ | :---------- |
| `get{CName} (query: {QDoc})` | [{MDoc]] | Multiple Documents based on `query` |
| `insert{CName} (doc: {MDoc})` | {MDoc} | Document Inserted |
| `delete{CName} (filter: {QDoc})` | {MDoc} | Document Removed |
| `update{CName} (filter: {QDoc}, update: {MDoc))` | {MDoc} | Document before Update |
