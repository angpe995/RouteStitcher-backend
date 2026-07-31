const axios = require("axios");
jest.mock("axios");
const { getAccessToken } = require("../../services/authService");
const fs = require("fs/promises");

const path = require("path");
const TOKEN_FILE = path.join(
    __dirname,
    "../../data",
    "token.json"
);
let now = null;
beforeEach(async () => {
    jest.useFakeTimers();
    now = Date.now();
    jest.setSystemTime(now);
    await fs.writeFile(
        TOKEN_FILE,
        JSON.stringify({
            accessToken: "cachedToken",
            expiresAt: now + 1000
        })
    );
});

afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
});
beforeEach(() => {
    axios.post.mockResolvedValue({
        data: {
            access_token: "newToken",
            expires_in: 2
        }
    });
});
it("should return token", async () => {
    const token= await getAccessToken();
    expect(token).not.toBe(null);
});
it("should use cached token", async () => {
    const token = await getAccessToken();
    expect(token).toBe("cachedToken");
});

it("should refresh token after expiration", async () => {
    await fs.writeFile(
    TOKEN_FILE,
    JSON.stringify({
        accessToken: "cachedToken",
        expiresAt: now
    })
    );
    await getAccessToken();
    expect(axios.post).toHaveBeenCalledTimes(1);
});
it("should return authentication failure", async()=>
{
    await fs.writeFile(
    TOKEN_FILE,
    JSON.stringify({
        accessToken: "cachedToken",
        expiresAt: now
    })
    );
    axios.post.mockRejectedValue(
        new Error("Request failed with status code 401")
    );
     await expect(getAccessToken()).rejects.toThrow(
        "Request failed with status code 401"
    );
}
);