const request = require("supertest");
import app from "./app";
import { contentErrors } from "./loaders";

describe("Test the root path", () => {
  it("should respond with 200 to the GET method", async () => {
    const response = await request(app).get("/");
    expect(response.statusCode).toBe(200);
  });
});


describe("Test for content errors", () => {
    it("should load content without errors", async () => {
        expect(contentErrors).toMatchInlineSnapshot(`Array []`);
    });
  });
  