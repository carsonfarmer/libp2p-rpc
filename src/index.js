import znode from "znode";
import { duplex } from "it-to-stream";
import buffer from "it-buffer";

const protocol = "/libp2p-rpc-1.0";

/**
 * @typedef {Record<string, string | Uint8Array | (...args: any[]) => (Promise<RPCObject> | RPCObject)} RPCObject
 */

/**
 * Create a handler function to be used by a libp2p host.
 * @param {RPCObject} rpc An object representing a set of RPC methods
 * as defined in {@link https://github.com/mikeal/znode}.
 */
const handler = (rpc) => {
  return ({ stream: { source, sink } }) => {
    const socket = duplex({ source: buffer(source), sink });
    return znode(socket, rpc);
  };
};

/**
 * Create a dialer function to setup an RPC connection with a remote libp2p peer.
 * @param {import("libp2p")} host The local host used to dial and make the
 * connection.
 * @param {RPCObject} rpc An object representing a set of RPC methods
 * as defined in {@link https://github.com/mikeal/znode}.
 */
const dialer = (host, rpc) => {
  return async (addr) => {
    const {
      stream: { source, sink },
    } = await host.dialProtocol(addr, protocol);
    const socket = duplex({ source: buffer(source), sink });
    return znode(socket, rpc);
  };
};

/**
 * Setup a handler and return a dialer for the specified RPC specification.
 * @param {import("libp2p")} host The local host used to dial and make the
 * connection.
 * @param {RPCObject} rpc An object representing a set of RPC methods
 * as defined in {@link https://github.com/mikeal/znode}.
 */
const create = (host, rpc) => {
  host.handle(protocol, handler(rpc));
  return dialer(host, rpc);
};

export default create;
export { protocol, handler, dialer, create };
