require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const placesRoutes = require('./routes/places-routes');
const usersRoutes = require('./routes/users-routes');

const HttpError = require('./models/http-error');

const app = express();

app.use(bodyParser.json())

app.use('/api/places', placesRoutes);
app.use('/api/users', usersRoutes);

// middleware to catch the responses that have not been catched before
app.use((req, res, next) => {
    return next(error = new HttpError('Could not find this route', 404));
});

/* error handling middleware function
 it executes if any middleware in front of it yields an error
 */
app.use((error, req, res, next) => {
    if (res.headerSent) {
        return next(error);
    }

    res.status(error.code || 500)
        .json({ message: error.message || 'An unknown error occured' });
});

mongoose
    .connect(`mongodb+srv://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@cluster0-fxufz.mongodb.net/${process.env.MONGO_DB_NAME}?retryWrites=true&w=majority`)
    .then(() => {
        app.listen(5000);
    })
    .catch(err => {
        console.log(err);
    });
