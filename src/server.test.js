const test = require("node:test");
const assert = require("node:assert/strict");

const { createServer } = require("./server");

test("health endpoint responds ok", async () => {
  const server = createServer();

  await new Promise(resolve => server.listen(0, resolve));
  const { port } = server.address();

  const response = await fetch(`http://localhost:${port}/health`);
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.equal(body, "ok");

  await new Promise(resolve => server.close(resolve));
});

test("api returns a list of snippets", async () => {
  const server = createServer();

  await new Promise(resolve => server.listen(0, resolve));
  const { port } = server.address();

  const response = await fetch(`http://localhost:${port}/api/snippets`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(body));

  await new Promise(resolve => server.close(resolve));
});
