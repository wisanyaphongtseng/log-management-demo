const request = require("supertest");
const app = require("../server");

describe("POST /ingest", () => {

  it("should reject invalid payload", async () => {
    const res = await request(app)
      .post("/ingest")
      .send("invalid");

    expect(res.statusCode).toBe(400);
  });

  it("should accept valid log", async () => {
    const res = await request(app)
      .post("/ingest")
      .send({
        tenant: "testA",
        event_type: "login_success",
        ip: "1.1.1.1"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
  });

});