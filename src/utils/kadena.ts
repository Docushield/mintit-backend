import Pact from "pact-lang-api";

const kp = {
  publicKey: process.env.PUBLIC_KEY,
  secretKey: process.env.SECRET_KEY,
};

const senderAccount = `k:${kp.publicKey}`;
export const apiHost = process.env.API_HOST || "https://api.testnet.chainweb.com";
export const networkId = process.env.NETWORK_ID || "testnet04";
export const chainId = process.env.CHAIN_ID || "1";
const gasPrice = process.env.GAS_PRICE || 0.00000001;
const gasLimit = process.env.GAS_LIMIT || 100000;
export const apiEndpoint =
  apiHost + "/chainweb/0.0/" + networkId + "/chain/" + chainId + "/pact";
export const sendTx = async (expression: string, envData = {}, caps = []) => {
  let metaInfo = Pact.lang.mkMeta(
    senderAccount,
    chainId,
    gasPrice,
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
      envData: envData,
    },
  ];
  console.log(JSON.stringify(cmd));

  try {
    let resp = await Pact.fetch.send(cmd, apiEndpoint);
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
    let listenTxResponse = await Pact.fetch.listen(cmd, apiEndpoint);
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

const apiPost = async (route, payload) =>
  fetch(`${apiEndpoint}/api/v1/${route}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

export const send = async (payload) =>
  await (await apiPost("send", payload)).json();

const mkGuard = (publicKey) => {
  return {
    keys: [publicKey],
    pred: "keys-all",
  };
};

const prepareSigningCmd = (pactCode, data, caps) => {
  const nonce = Math.floor(new Date().getTime() / 1000);
  const meta = Pact.lang.mkMeta(
    senderAccount,
    chainId,
    gasPrice,
    gasLimit,
    nonce,
    3600
  );
  const signers = [
    {
      publicKey: kp.publicKey,
      clist: caps,
    },
  ];
  const payload = {
    exec: {
      data: data,
      code: pactCode,
    },
  };

  return {
    payload,
    signers,
    meta,
    nonce,
  };
};

const signCmd = (cmd) => Pact.crypto.sign(JSON.stringify(cmd), kp);

export const mkCmd = (pactCode, data, caps) => {
  const signingCmd = prepareSigningCmd(pactCode, data, caps);
  const sig = signCmd(signingCmd);

  return Pact.api.mkSingleCmd([sig], JSON.stringify(signingCmd));
};

export const mkCap = (role, description, name, args) => {
  return {
    role,
    description,
    cap: {
      name, 
      args
    }
  }
};