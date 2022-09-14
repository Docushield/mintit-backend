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
export const sendTx = async (expression: string) => {
  let metaInfo = Pact.lang.mkMeta(
    "k:" + kp.publicKey,
    chainId,
    0.0001,
    1000,
    Math.floor(new Date().getTime() / 1000),
    60
  );
  let cmd = [
    {
      keyPairs: kp,
      pactCode: expression,
      meta: metaInfo,
      networkId: networkId,
    },
  ];

  try {
    let resp = await Pact.fetch.send(cmd, api);
    console.log("response recieved from sendTx: ", resp);
    return resp;
  } catch (e) {
    console.log("Error occurred while sending tx: ", e);
    return null;
  }
};

export const listenTx = async (requestKey: string) => {
  let cmd = { listen: requestKey };
  try {
    let listenTxResponse = await Pact.fetch.listen(cmd, api);
    console.log("data recieved from listen: ", listenTxResponse);
    return listenTxResponse;
  } catch (e) {
    console.log(
      "Error occurred while listening on tx: ",
      e,
      " for request_key: ",
      requestKey
    );
    console.log("Retrying listening on requestKey: ", requestKey);
    return listenTx(requestKey);
  }
};
