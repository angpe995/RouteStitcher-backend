const pkpApi = require("../services/pkpApi");
const stationService=require("../services/stationService")
exports.getStations = (req, res) => {
    res.json(stationService.getStations());
}
exports.searchStation=async (req,res)=>{
    try{

    }
    catch{

    }
}
