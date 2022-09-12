import Pact from "pact-lang-api";

const kp = {
  publicKey: process.env.PUBLIC_KEY,
  secretKey: process.env.SECRET_KEY,
};
const api_host = process.env.API_HOST || "https://api.testnet.chainweb.com";
const networkId = process.env.NETWORK_ID || "testnet04";
const chainId = process.env.CHAIN_ID || "1";
const api =
  api_host + "/chainweb/0.0/" + networkId + "/chain/" + chainId + "/pact";
let metaInfo = Pact.lang.mkMeta(
  "k:" + kp.publicKey,
  chainId,
  0.0001,
  1000,
  Math.floor(new Date().getTime() / 1000),
  28800
);

export const sendTx = (expression: string) => {
  let cmd = [
    {
      keyPairs: kp,
      pactCode: expression,
      meta: metaInfo,
      networkId: networkId,
    },
  ];
  return Pact.fetch.send(cmd, api);
};

export const listenTx = (requestKey: string) => {
  let cmd = { listen: requestKey };
  return Pact.fetch.listen(cmd, api);
};
