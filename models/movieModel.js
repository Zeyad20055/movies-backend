const { ObjectId, getDb } = require('./mongodbConnection');

const LIMIT = 20;

// make user text safe to use inside a RegExp ("." or "(" must not act as regex symbols)
function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function moviesCollection() {
    const db = await getDb();
    return db.collection("movies");
}

/* ---------- Lab: home page = recent 20 movies ordered by year ---------- */
async function index() {
    const movies = await moviesCollection();
    return movies.find().sort({ year: -1, _id: -1 }).limit(LIMIT).toArray();
}

/* ---------- Lab: search by part of title OR part of a cast member name ---------- */
async function moviesSearch(text) {
    const movies = await moviesCollection();
    const regex = new RegExp(escapeRegex(text), 'i');
    // "cast" is an array of names: a regex on an array matches if ANY element matches
    return movies
        .find({ $or: [{ title: regex }, { cast: regex }] })
        .sort({ year: -1, _id: -1 })
        .limit(LIMIT)
        .toArray();
}

/* ---------- Homework: recent 20 movies of one genre ---------- */
async function moviesByGenre(genre) {
    const movies = await moviesCollection();
    // "genres" is an array: { genres: "Action" } matches if the array contains "Action"
    return movies.find({ genres: genre }).sort({ year: -1, _id: -1 }).limit(LIMIT).toArray();
}

/* ---------- Homework: CRUD ---------- */
async function show(id) {
    const movies = await moviesCollection();
    return movies.findOne({ _id: new ObjectId(String(id)) });   // null if not found
}

async function store(doc) {
    const movies = await moviesCollection();
    return movies.insertOne(doc);
}

async function update(id, fields) {
    const movies = await moviesCollection();
    return movies.updateOne({ _id: new ObjectId(String(id)) }, { $set: fields });
}

async function destroy(id) {
    const movies = await moviesCollection();
    return movies.deleteOne({ _id: new ObjectId(String(id)) });
}

module.exports = {
    index,
    moviesSearch,
    moviesByGenre,
    show,
    store,
    update,
    destroy,
};
