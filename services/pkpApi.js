const axios = require("axios");

const api = axios.create({
  baseURL: "https://api.koleo.pl/v2/main",
  headers: {
    "x-koleo-version": "2",
    "accept-eol-response-version": "1",
    "x-koleo-client": "Nuxt-c0191c0",
  },
});
module.exports = api;
