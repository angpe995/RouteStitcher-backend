const axios = require("axios");

const api = axios.create({
    baseURL: "https://koleo.pl/api/v2/main",
    headers: {
        "x-koleo-version": "2"
    }
});

module.exports = api;