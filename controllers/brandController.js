const brandService = require("../services/brandService");
const getBrands = async (req, res) => {
    try {
        const brands = await brandService.getBrands();

        return res.json(brands);
    } catch (err) {
        console.error("GET BRANDS ERROR:", err);

        return res.status(500).json({
            error: err.message
        });
    }
};
module.exports = {
    getBrands
};
