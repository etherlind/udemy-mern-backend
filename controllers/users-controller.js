const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const User = require('./../models/user');

const DUMMY_USERS = [{
    id: 'u1',
    name: 'Saul Goodman',
    email: 'test@test.com',
    password: 'testers'
}];

const getUsers = async (req, res, next) => {

    let users;
    try {
        users = await User.find({}, '-password');
    } catch (error) {
        return next(new HttpError('Fetching users failed, please try again later.', 500));
    }

    res.json({ users: users.map(u => u.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(422);
        return next(new HttpError('Invalid inputs passed, please check your data.', 422));
    }

    const { name, email, password } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email });
    } catch (error) {
        return next(new HttpError('Signing up failed, please try again later.', 422));
    }

    if (existingUser) {
        return next(new HttpError('User exists already, please login instead.', 422));
    }

    const createdUser = new User({
        name,
        email,
        image: 'https://images.amcnetworks.com/amc.com/wp-content/uploads/2015/04/cast_bb_800x600_saul-goodman.jpg',
        password,
        places: []
    });

    try {
        await createdUser.save();
    } catch (e) {
        return next(new HttpError('Signing up failed, please try again.', 500));
    }

    res.status(201).json({ user: createdUser.toObject({ getters: true }) });

};

const login = async (req, res, next) => {

    const { email, password } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email });
    } catch (error) {
        return next(new HttpError('Logging up failed, please try again later.', 422));
    }

    if (!existingUser || existingUser.password !== password) {
        return next(new HttpError('Invalid credentials, could not log you in.', 401));
    }

    res.json({ message: 'Logged in!' });
};


exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
