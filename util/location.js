const axios = require('axios');

const HttpError = require('../models/http-error');

const API_KEY = '';

async function getCoordsForAddress(address) {

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    console.log(url);
    const response = await axios.get(url);

    const data = response.data;
    console.log(data);

    if (!data || data.status === 'ZERO_RESULTS') {
        return next(new HttpError('Could not find location for the specified address', 422));
    }

    console.log(data.results[0]);
    const coordinates = data.results[0].geometry.location;

    return coordinates;
}

module.exports = getCoordsForAddress;
