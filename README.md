# libp2p-rpc

[![standard-readme](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

> Bi-directional RPC over libp2p streams.

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [API](#api)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)

## Install

```bash
npm i @nullify/libp2p-rpc
```

## Usage

```javascript
import create from "@nullify/libp2p-rpc";
// We need a libp2p bundle as derived from js-ipfs, js-libp2p, or the below...
import node from "@nullify/libp2p-bundle";

const run = async () => {
  // Create two peers for communicating
  const node1 = await node({
    multiaddrs: ["/ip4/0.0.0.0/tcp/4007", "/ip4/0.0.0.0/tcp/4008/ws"],
  });
  const node2 = await node();

  // Create a "server" peer (all peers can be both client and peer)
  await create(node1, { ping: () => "pong" });

  // Create a "client" peer and keep reference to dialer function
  const dial = create(node2, { pong: () => "ping" });

  // Start em up!
  await node1.start();
  await node2.start();

  // Get reference to node1's multiaddress
  const addrs = node1.multiaddrs.map(
    (ma) => `${ma.toString()}/p2p/${node1.peerId.toB58String()}`
  );

  // Dial node1 and establish rpc client
  const remote = await dial(addrs[0]);

  // Ping node1/remote and get result
  const result = await remote.ping();
  console.log(result);

  // Spin em' down
  await node1.stop();
  await node2.stop();
  process.exit();
};

run();
```

## API

### `create(host, rpc): (addr: any) => Promise<import('znode')>`

```javascript
/**
 * Setup a handler and return a dialer for the specified RPC specification.
 * @param {import("libp2p")} host The local host used to dial and make the
 * connection.
 * @param {any} rpc An object representing a set of RPC methods
 * as defined in {@link https://github.com/mikeal/znode}.
 */
const create = (host, rpc) => {
  ...
}
```

### `handler(rpc): ({ stream: { source, sink } }) => Promise<import('znode')>`

```javascript
/**
 * Create a handler function to be used by a libp2p host.
 * @param {any} rpc An object representing a set of RPC methods
 * as defined in {@link https://github.com/mikeal/znode}.
 */
const handler = (rpc) => {
  ...
}
```

### `dialer(host, rpc): (addr: any) => Promise<import('znode')>`

```javascript
/**
 * Create a dialer function to setup an RPC connection with a remote libp2p peer.
 * @param {import("libp2p")} host The local host used to dial and make the
 * connection.
 * @param {any} rpc An object representing a set of RPC methods
 * as defined in {@link https://github.com/mikeal/znode}.
 */
const dialer = (host, rpc) => {
  ...
}
```

## Maintainers

[@carsonfarmer](https://github.com/carsonfarmer)

## Contributing

PRs accepted.

Small note: If editing the README, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

MIT © 2021 Carson Farmer
