const request = require("supertest");
const app = require("../server");

it("should detect brute force after 5 attempts", async () => {
  for (let i = 0; i < 5; i++) {
    await request(app)
      .post("/ingest")
      .send({
        tenant: "test",
        event_type: "login_failed",
        ip: "9.9.9.9"
      });
  }

  const res = await request(app).get("/alerts/bruteforce");

  expect(res.body.alert).toBe(true);
});