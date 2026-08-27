const brandService = require("../services/brandService");
const getBrands = async (req, res) => {
    return res.json(brandService.getBrands());
};
module.exports={
    getBrands
}
