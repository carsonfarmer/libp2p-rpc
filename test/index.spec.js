/* eslint-env mocha */

import chai from "chai";
import node from "@nullify/libp2p-bundle";
import create from "../src/index.js";

const { expect } = chai;

describe("libp2p rpc", function () {
  // Provide some extra time for ci since we're starting libp2p nodes in each test
  this.timeout(25 * 1000);

  let nodes = [];

  before(async () => {
    nodes.push(
      ...(await Promise.all([
        node({ repo: {} }),
        node({
          repo: {},
          multiaddrs: ["/ip4/0.0.0.0/tcp/4004", "/ip4/0.0.0.0/tcp/4005/ws"],
        }),
      ]))
    );
  });

  afterEach(async () => {
    if (nodes.length) {
      for (const node of nodes) {
        await node.stop();
      }
    }
  });

  it("should create rpc handler and dialer", async () => {
    const [node1, node2] = nodes;

    // Don't bother keeping reference to dialer here
    await create(node1, { ping: () => "pong" });

    // Get dialer, which we'll use to ping node1
    const dial = create(node2, { pong: () => "ping" });

    await node1.start();
    await node2.start();

    const addrs = node1.multiaddrs.map(
      (ma) => `${ma.toString()}/p2p/${node1.peerId.toB58String()}`
    );

    // Dial node1 and establish rpc client
    const remote = await dial(addrs[0]);

    // Ping node1/remote and get result
    const result = await remote.ping();
    expect(result).to.equal("pong");
  });

  it("should handle async methods with arguments", async () => {
    const [node1, node2] = nodes;
    const rpc = {
      testargs: async (one, two, three) => [one, two, three],
    };
    create(node1, rpc);
    const client = create(node2, rpc);

    await node1.start();
    await node2.start();

    const addrs = node1.multiaddrs.map(
      (ma) => `${ma.toString()}/p2p/${node1.peerId.toB58String()}`
    );
    const remote = await client(addrs[0]);
    expect(await remote.testargs(1, 2, 3)).to.deep.equal([1, 2, 3]);
  });

  it("should handler static methods", async () => {
    const [node1, node2] = nodes;
    const rpc = { ping: () => Buffer.from("test"), id: "test" };
    create(node1, rpc);
    const client = create(node2, rpc);

    await node1.start();
    await node2.start();

    const addrs = node1.multiaddrs.map(
      (ma) => `${ma.toString()}/p2p/${node1.peerId.toB58String()}`
    );
    const remote = await client(addrs[0]);
    expect(await remote.ping()).to.deep.equal(Buffer.from("test"));
    expect(remote.id).to.equal("test");
  });

  it("should handle receiving methods from rpc response", async () => {
    const [node1, node2] = nodes;
    const rpc = {
      get: () => {
        return { ping: () => "pong" };
      },
    };
    create(node1, rpc);
    const client = create(node2, rpc);

    await node1.start();
    await node2.start();

    const addrs = node1.multiaddrs.map(
      (ma) => `${ma.toString()}/p2p/${node1.peerId.toB58String()}`
    );
    const remote = await client(addrs[0]);
    const remote2 = await remote.get();
    expect(await remote2.ping()).to.equal("pong");
  });
});
