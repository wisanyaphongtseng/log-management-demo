const request = require("supertest");
const app = require("../server");

describe("POST /login", () => {

  it("should reject invalid credentials", async () => {
    const res = await request(app)
      .post("/login")
      .send({
        username: "wrong",
        password: "wrong"
      });

    expect(res.statusCode).toBe(401);
  });

});