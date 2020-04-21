const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');

const Place = require('../models/place');
const User = require('../models/user');

const getPlaces = async (req, res, next) => {
    let places;
    try {
        places = await Place.find({});
    } catch (error) {
        return next(new HttpError('Fetching users failed, please try again later.', 500));
    }

    res.json({ users: places.map(u => u.toObject({ getters: true })) });

};
const getPlaceById = async (req, res, next) => {
    const placeId = req.params.pid;

    let place;
    try {
        place = await Place.findById(placeId);
    } catch (error) {
        return next(new HttpError('Something went wrong, could not find a place', 500));
    }

    if (!place) {
        return next(new HttpError('Could not find a place for the provided id.', 404));
    }
    // getters is used to keep the id property after transforming the Mongoose object to Javascript object via toObject()
    res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
    const userId = req.params.uid;

    let userWithPlaces;
    try {
        userWithPlaces = await User.findById(userId).populate('places');
    } catch (error) {
        return next(new HttpError('Something went wrong, could not find a place', 500));
    }

    if (!userWithPlaces || userWithPlaces.places.length === 0) {
        return next(new HttpError('Could not find a place for the provided id.', 404));
    }

    // getters is used to keep the id property after transforming the Mongoose object to Javascript object via toObject()
    res.json({ places: userWithPlaces.places.map(p => p.toObject({ getters: true })) });
};

const createPlace = async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid inputs passed, please check your data.', 422));
    }

    const { title, description, address, creator } = req.body;

    let location;
    try {
        location = await getCoordsForAddress(address);
    } catch (error) {
        return next(error);
    }

    const createdPlace = new Place({
        title,
        description,
        address,
        location,
        image: 'https://scontent.fbcn1-1.fna.fbcdn.net/v/t31.0-8/1973800_776139415748379_489197795_o.jpg?_nc_cat=110&_nc_sid=6e5ad9&_nc_ohc=cL4hjYR5A2sAX_nadO3&_nc_ht=scontent.fbcn1-1.fna&oh=67d56e804f405d3f864acd5e8702d1a6&oe=5EC53056',
        creator
    });

    let user;
    try {
        user = await User.findById(creator);
    } catch (error) {
        return next(new HttpError('Creating place failed, please try again.', 500));
    }

    if (!user) {
        return next(new HttpError('Could not find user for provided id.', 404));
    }

    try {

        const session = await mongoose.startSession();
        session.startTransaction();
        await createdPlace.save({ session });
        user.places.push(createdPlace);
        await user.save({ session });
        await session.commitTransaction();

    } catch (e) {
        return next(new HttpError('Creating place failed, please try again.', 500));
    }

    // 201 is the code for successfully creating something new
    res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid inputs passed, please check your data.', 422))
    }

    const { title, description } = req.body;
    const placeId = req.params.pid;

    let place;
    try {
        place = await Place.findById(placeId);
    } catch (err) {
        return next(new HttpError('Something went wrong, could not update place.', 500));
    }

    place.title = title;
    place.description = description;

    try {
        await place.save();
    } catch (error) {
        return next(new HttpError('Something went wrong, could not update place.', 500));
    }

    res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {

    const placeId = req.params.pid;

    let place;
    try {
        place = await Place.findById(placeId).populate('creator');
    } catch (error) {
        return next(new HttpError('Something went wrong, could not delete place.', 500));
    }

    if (!place) {
        return next(new HttpError('Could not find place for this id.', 404));
    }

    try {
        const session = await mongoose.startSession();
        session.startTransaction();

        await place.remove({ session });
        await place.creator.places.pull(place)
        await place.creator.save({ session });

        await session.commitTransaction();

    } catch (error) {
        return next(new HttpError('Something went wrong, could not delete place.', 500));
    }

    res.status(200).json({ message: "Place deleted successfully" });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.getPlaces = getPlaces;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
