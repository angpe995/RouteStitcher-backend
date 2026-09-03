const fs = require("fs/promises");
const api = require("./pkpApi");
let brandCache = [];
const path = require("path");
const BRAND_FILE = path.join(__dirname, "../data", "brand.json");
const loadBrandsFromFile = async () => {
  const file = await fs.readFile(BRAND_FILE, "utf8");
  brandCache = JSON.parse(file);
};
const fetchBrands = async () => {
    const response = await api.get("/brands");
    return response.data;
};
const saveBrandsToFile=async()=>{
     try{
        await fs.writeFile(BRAND_FILE,JSON.stringify(brandCache, null, 2),{encoding: "utf8"});
    }
    catch(e){
        console.error(e.message);
    }
}
const refreshBrands = async() => {
    const brands = await fetchBrands();
    brandCache = brands;
    await saveBrandsToFile(brands);
}
const initialize = async () => {
  try {
    await loadBrandsFromFile();
  } catch {
    try {
      await refreshBrands();
    } catch (err) {
      console.error(err);
      throw new Error("Failed to initialize stations cache.");
    }
    if (brandCache.length === 0) {
      throw new Error("Stations cache is empty after refresh.");
    }
  }
};
const getBrands = () => {
    return brandCache;
};
module.exports={
    initialize,getBrands
}
