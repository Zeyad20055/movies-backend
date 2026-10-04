const { MongoClient, ObjectId } = require('mongodb');

const mongoConnection = process.env.MONGODB_CONNECTION;

// one shared connection for the whole app (instead of connect/close on every query)
let clientPromise = null;

function getDb() {
    if (!clientPromise) {
        clientPromise = MongoClient.connect(mongoConnection);
        // if the connection fails, forget it so the next request can try again
        clientPromise.catch(() => { clientPromise = null; });
    }
    return clientPromise.then(client => client.db());
}

module.exports = {
    MongoClient,
    ObjectId,
    mongoConnection,
    getDb,
};
