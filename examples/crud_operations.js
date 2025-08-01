// Licensed under the Apache License, Version 2.0 (the 'License'); you may not
// use this file except in compliance with the License. You may obtain a copy of
// the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations under
// the License.

myRepository = {};

createDatabaseConnection = async () => {
    // connect to server
    const server = require('nano')('http://your-username:your-password@localhost:5984');
    // connect to database
    return await server.db.use('your-database');
}

myRepository.getAll = async () => {
    try {
        const db = await createDatabaseConnection();
        const response = await db.find({ selector: {}});
        return response.docs;
    } catch (err) {
        console.error(err);
    }
};

myRepository.get = async (id) => {
    try {
        const db = await createDatabaseConnection();
        const response = await db.get(id);
        return response;
    } catch (err) {
        console.error(err);
        return null;
    }
};

myRepository.insert = async (id, document) => {
    try {
        const db = await createDatabaseConnection();
        const response = await db.insert(document, id);
        return response.ok;
    } catch (err) {
        console.error(err);
        return false;
    }
};

myRepository.update = async (id, newDocument) => {
    try {
        const db = await createDatabaseConnection();
        const existingDocument = await db.get(id);
        if (existingDocument) {
            // If you need to update a document then you should just insert again (but specifying the revision you are updating)
            newDocument["_rev"] = existingDocument["_rev"];
            const response = await db.insert(newDocument, id);
            return response.ok;
        }
    } catch (err) {
        console.error(err);
        return false;
    }
};

myRepository.delete = async (id) => {
    try {
        const db = await createDatabaseConnection();
        const existingDocument = await db.get(id);
        const response = await db.destroy(id, existingDocument["_rev"]);
        return response.ok;
    } catch (err) {
        console.error(err);
        return false;
    }
};


// Test repository calls
(async() => {
    console.log("---  First insert  ---");
    const insertResult = await myRepository.insert("my-document-1", { "someField": "Hello"});
    console.log(insertResult);

    console.log("--- Delete ---");
    const deleteResult = await myRepository.delete("my-document-1");
    console.log(deleteResult);

    console.log("---  Second insert ---");
    const anotherInsertResult = await myRepository.insert("my-document-2", { "someField": "Hello"});
    console.log(anotherInsertResult);

    console.log("---  Update ---");
    const updateResult = await myRepository.update("my-document-2", { "someField": "Hello there!"});
    console.log(updateResult);

    console.log("---  Get All ---");
    const resultAll = await myRepository.getAll();
    console.log(resultAll);
    
    console.log("---  Get By Id ---");
    const result = await myRepository.get("my-document-2");
    console.log(result);
})();
