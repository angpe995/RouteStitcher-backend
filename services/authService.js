require("dotenv").config();
let accessToken = null;
let expiresAt = 0;
const axios = require("axios");
const fs = require("fs/promises");
const path = require("path");
const TOKEN_FILE = path.join(
    __dirname,
    "../data",
    "token.json"
);
const {
    KOLEO_EMAIL,
    KOLEO_PASSWORD,
    KOLEO_GRANT_TYPE,
    KOLEO_CLIENT_ID
} = process.env;
const saveToken = async(token, expiresIn)=> {
    await fs.writeFile(
        TOKEN_FILE,
        JSON.stringify({
            accessToken: token,
            expiresAt: Date.now() + (expiresIn - 60) * 1000
        }, null, 2)
    );
};
const loadToken = async()=> {
    try {
        const data = JSON.parse(await fs.readFile(TOKEN_FILE, "utf8"));
        if (Date.now() < data?.expiresAt) {
            return data.accessToken;
        }
    } catch {
        console.error("File");
    }

    return null;
};
const getAccessToken = async ()=>{
    const token=await loadToken();
    if (token!=null) {
        return token;
    }
    try {
        const response = await axios.post("https://api.koleo.pl/v2/main/oauth/token",
        {
            "username": KOLEO_EMAIL,
            "password": KOLEO_PASSWORD,
            "grant_type": KOLEO_GRANT_TYPE,
            "client_id": KOLEO_CLIENT_ID
        },
        {
            headers: {
                    "Content-Type": "application/json",
                    "x-koleo-client": "Nuxt-c0191c0",
                    "x-koleo-version": "2",
                    "User-Agent":"Mozilla/5.0"

            }
        });
        accessToken = response.data.access_token;
        expiresAt = Date.now() + (response.data.expires_in - 60) * 1000;
        saveToken(accessToken,expiresAt);
        return accessToken;
    } catch (err) {
        console.error("Failed to obtain KOLEO token:", err.message);
        throw err;
    }
  
};

async function authorizeApi() {
    const token = await getAccessToken();

    api.defaults.headers.Authorization = `Bearer ${token}`;
}
module.exports={
    getAccessToken
}