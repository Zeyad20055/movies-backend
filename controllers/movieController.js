const path = require("path");
const fs = require("fs/promises");
const { ObjectId } = require("../models/mongodbConnection");
const movieModel = require("../models/movieModel");

const GENRES = ["Action", "Drama", "Comedy"];       // buttons on the home page
const UPLOAD_URL = "/img/uploades/";                 // how uploaded thumbnails are stored in the db
const UPLOAD_DIR = path.resolve("./", "public/img/uploades");

/* ------------------------- helpers ------------------------- */

// "Tom Hanks, Meg Ryan" -> ["Tom Hanks", "Meg Ryan"]
function toList(text) {
    const items = String(text || "").split(",").map(s => s.trim()).filter(Boolean);
    return [...new Set(items)];
}

function isUploadedImage(thumbnail) {
    return typeof thumbnail === "string" && thumbnail.startsWith(UPLOAD_URL);
}

// delete an uploaded image file from disk (ignore if it is already gone)
async function removeUploadedFile(thumbnail) {
    if (!isUploadedImage(thumbnail)) return;
    await fs.unlink(path.join(UPLOAD_DIR, path.basename(thumbnail))).catch(() => { });
}

// validate + clean the create/update form
function readForm(body) {
    const errors = [];
    const title = String(body.title || "").trim();
    const yearNumber = Number(body.year);
    const thumbnail = String(body.thumbnail || "").trim();
    const maxYear = new Date().getFullYear() + 5;

    if (!title) errors.push("Title is required.");
    if (!Number.isInteger(yearNumber) || yearNumber < 1888 || yearNumber > maxYear) {
        errors.push("Year must be a whole number between 1888 and " + maxYear + ".");
    }
    if (thumbnail && !/^https?:\/\//i.test(thumbnail)) {
        errors.push("Thumbnail link must start with http:// or https://");
    }

    return {
        errors,
        data: {
            title,
            year: yearNumber,
            genres: toList(body.genres),
            cast: toList(body.cast),
            thumbnail,
        },
        // what we show again in the form if something is wrong
        formValues: { title, year: body.year, genres: toList(body.genres), cast: toList(body.cast), thumbnail },
    };
}

function notFound(res) {
    res.status(404).render("pages/movies/notFound", { pageTitle: "Not found" });
}

/* ------------------- Lab: home + search ------------------- */

const index = async (req, res) => {
    const movies = await movieModel.index();
    res.render("pages/movies/index", {
        movies, genres: GENRES, activeGenre: "", q: "",
        heading: "Recent 20 movies",
    });
};

const moviesSearch = async (req, res) => {
    const q = String(req.query.q || "").trim();
    if (q === "") return res.redirect("/movies");

    const movies = await movieModel.moviesSearch(q);
    res.render("pages/movies/index", {
        movies, genres: GENRES, activeGenre: "", q,
        heading: 'Search results for "' + q + '"',
    });
};

/* ------------------- Homework: genre buttons ------------------- */

const moviesByGenre = async (req, res) => {
    // only the three allowed genres (also ignores upper/lower case in the url)
    const genre = GENRES.find(g => g.toLowerCase() === String(req.params.genre).toLowerCase());
    if (!genre) return notFound(res);

    const movies = await movieModel.moviesByGenre(genre);
    res.render("pages/movies/index", {
        movies, genres: GENRES, activeGenre: genre, q: "",
        heading: "Recent 20 " + genre + " movies",
    });
};

/* ------------------- Homework: CRUD ------------------- */

// R (one movie)
const show = async (req, res) => {
    if (!ObjectId.isValid(req.params.id)) return notFound(res);
    const movie = await movieModel.show(req.params.id);
    if (!movie) return notFound(res);
    res.render("pages/movies/show", { movie, pageTitle: movie.title });
};

// C
const createForm = (req, res) => {
    res.render("pages/movies/form", {
        pageTitle: "Add Movie", heading: "Add New Movie",
        action: "/movies/store", movie: {}, errors: [],
    });
};

const store = async (req, res) => {
    const { errors, data, formValues } = readForm(req.body);

    if (errors.length > 0) {
        if (req.file) await removeUploadedFile(UPLOAD_URL + req.file.filename);   // don't keep the file
        return res.status(400).render("pages/movies/form", {
            pageTitle: "Add Movie", heading: "Add New Movie",
            action: "/movies/store", movie: formValues, errors,
        });
    }

    // an uploaded file wins over the link
    if (req.file) data.thumbnail = UPLOAD_URL + req.file.filename;

    await movieModel.store(data);
    res.redirect("/movies");
};

// U
const updateForm = async (req, res) => {
    if (!ObjectId.isValid(req.params.id)) return notFound(res);
    const movie = await movieModel.show(req.params.id);
    if (!movie) return notFound(res);

    res.render("pages/movies/form", {
        pageTitle: "Edit Movie", heading: "Edit Movie",
        action: "/movies/update/" + movie._id, movie, errors: [],
    });
};

const update = async (req, res) => {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) return notFound(res);
    const oldMovie = await movieModel.show(id);
    if (!oldMovie) return notFound(res);

    const { errors, data, formValues } = readForm(req.body);

    if (errors.length > 0) {
        if (req.file) await removeUploadedFile(UPLOAD_URL + req.file.filename);
        return res.status(400).render("pages/movies/form", {
            pageTitle: "Edit Movie", heading: "Edit Movie",
            action: "/movies/update/" + id,
            movie: { ...formValues, _id: id, thumbnail: oldMovie.thumbnail },
            errors,
        });
    }

    // thumbnail: new file > new link > keep the old one
    if (req.file) {
        data.thumbnail = UPLOAD_URL + req.file.filename;
    } else if (!data.thumbnail) {
        delete data.thumbnail;
    }

    await movieModel.update(id, data);

    // the old uploaded file is not used anymore
    if (data.thumbnail && data.thumbnail !== oldMovie.thumbnail) {
        await removeUploadedFile(oldMovie.thumbnail);
    }
    res.redirect("/movies");
};

// D
const destroy = async (req, res) => {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) return notFound(res);
    const movie = await movieModel.show(id);
    if (!movie) return notFound(res);

    await movieModel.destroy(id);
    await removeUploadedFile(movie.thumbnail);
    res.redirect("/movies");
};

module.exports = {
    index,
    moviesSearch,
    moviesByGenre,
    show,
    createForm,
    store,
    updateForm,
    update,
    destroy,
};
