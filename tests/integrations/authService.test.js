const { getAccessToken } = require("../../services/authService");
it("should return token", async () => {
    const token= await getAccessToken();
     expect(token).not.toBe(null);
});