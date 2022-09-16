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
export const sendTx = async (expression: string, caps = []) => {
  let metaInfo = Pact.lang.mkMeta(
    "k:" + kp.publicKey,
    chainId,
    0.00000001,
    5000,
    Math.floor(new Date().getTime() / 1000),
    60
  );
  let cmd = [
    {
      keyPairs: kp,
      pactCode: expression,
      meta: metaInfo,
      networkId: networkId,
      caps: caps,
    },
  ];
  console.log(JSON.stringify(cmd));

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
  console.log(cmd);
  try {
    let listenTxResponse = await Pact.fetch.listen(cmd, api);
    console.log("data recieved from listen: ", listenTxResponse);
    // check for any timeout's or other issue.
    if (
      typeof listenTxResponse === "string" &&
      listenTxResponse.includes("<html>")
    ) {
      console.log("Retrying listening on requestKey: ", requestKey);
      return listenTx(requestKey);
    }
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
