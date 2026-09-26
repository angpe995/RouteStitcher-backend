const api = require("./pkpApi");

let brandCache = [];

const fetchBrands = async () => {
    console.log("FETCHING BRANDS FROM PKP");

    const response = await api.get("/brands");

    console.log("PKP BRANDS STATUS:", response.status);
    console.log("PKP BRANDS COUNT:", response.data.length);

    return response.data;
};

const getBrands = async () => {
    if (brandCache.length === 0) {
        brandCache = await fetchBrands();
    }

    return brandCache;
};

const refreshBrands = async () => {
    brandCache = await fetchBrands();
    return brandCache;
};

module.exports = {
    getBrands,
    refreshBrands
};
