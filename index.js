const express = require('express');
const app = express();
require('dotenv').config();

/* ------------- public folder ---------------- */
app.use(express.static(__dirname + '/public'));
/* ------------- view engine ------------------ */
app.set('view engine', 'ejs');
/* -------------- using form data -------------- */
app.use(express.urlencoded({ extended: true }));
/* ------------- router ----------------------- */
const webRouter = require('./route/web');
app.use(webRouter);

/* ------------- errors (db down, bad upload, ...) ------------- */
app.use((err, req, res, next) => {
    console.error(err);
    const status = err.name === "MulterError" || err.message === "Thumbnail must be an image file." ? 400 : 500;
    res.status(status).send(status === 400 ? err.message : "Something went wrong, please try again.");
});

/* ---------------- start server --------------- */
const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log("server start at port " + port);
});
