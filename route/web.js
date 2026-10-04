const express = require('express');
const webRouter = express.Router();
const multer = require("multer");
const path = require("path");

/* ------------- controllers ------------------- */
const movieController = require('../controllers/movieController');

/* ------------- upload (thumbnail image) ------------------- */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/img/uploades/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 },                  // max 2MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) cb(null, true);
        else cb(new Error("Thumbnail must be an image file."));
    }
});

/* -------------- route roles ------------------------ */
webRouter.get('/', (req, res) => res.redirect('/movies'));

/* ---------- lab: home + search ---------- */
webRouter.get('/movies', movieController.index);
webRouter.get('/moviesSearch', movieController.moviesSearch);

/* ---------- homework: genre buttons ---------- */
webRouter.get('/movies/genre/:genre', movieController.moviesByGenre);

/* ---------- homework: CRUD ---------- */
// (createForm must be before /movies/:id style routes)
webRouter.get('/movies/createForm', movieController.createForm);
webRouter.post('/movies/store', upload.single('thumbnailFile'), movieController.store);

webRouter.get('/movies/show/:id', movieController.show);

webRouter.get('/movies/updateForm/:id', movieController.updateForm);
webRouter.post('/movies/update/:id', upload.single('thumbnailFile'), movieController.update);

webRouter.post('/movies/destroy/:id', movieController.destroy);

module.exports = webRouter;
