import Pact from "pact-lang-api";

const kp = {
  publicKey: process.env.PUBLIC_KEY,
  secretKey: process.env.SECRET_KEY,
};

// Second keypair to sign caps
const kp_caps = {
  publicKey: process.env.PUBLIC_KEY_CAPS,
  secretKey: process.env.SECRET_KEY_CAPS,
};

const senderAccount = `k:${kp.publicKey}`;
export const apiHost =
  process.env.API_HOST || "https://api.testnet.chainweb.com";
export const networkId = process.env.NETWORK_ID || "testnet04";
export const chainId = process.env.CHAIN_ID || "1";
const gasPrice = parseInt(process.env.GAS_PRICE || "0.00000001") || 0.00000001;
const gasLimit = parseInt(process.env.GAS_LIMIT || "100000") || 100000;
export const apiEndpoint =
  apiHost + "/chainweb/0.0/" + networkId + "/chain/" + chainId + "/pact";
export const sendTx = async (expression: string, envData = {}, caps = []) => {
  let metaInfo = Pact.lang.mkMeta(
    senderAccount,
    chainId,
    gasPrice,
    gasLimit,
    Math.floor(new Date().getTime() / 1000),
    3600
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

export const localTx = async (expression: string, envData = {}, caps = []) => {
  let metaInfo = Pact.lang.mkMeta(
    senderAccount,
    chainId,
    gasPrice,
    gasLimit,
    Math.floor(new Date().getTime() / 1000),
    3600
  );
  let cmd = {
    pactCode: expression,
    meta: metaInfo,
    networkId: networkId,
    envData: envData,
  };
  console.log(JSON.stringify(cmd));

  try {
    let resp = await Pact.fetch.local(cmd, apiEndpoint);
    console.log("response recieved from local tx: ", resp);
    return resp;
  } catch (e) {
    console.log("Error occurred while sending local tx: ", e);
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

const apiGet = async (route) =>
  fetch(`${apiHost + "/chainweb/0.0/" + networkId}/${route}`, {});

export const cut = async () => await (await apiGet("cut")).json();

export const send = async (payload) => {
  const resp = await apiPost("send", payload);
  console.log("SEND RESP :", resp);
  const parsed_resp = await resp.json();
  console.log("PARSED RESP :", parsed_resp);
  return parsed_resp;
}

export const local = async (payload) => {
  const resp = await await apiPost("local", payload);
  console.log(resp);
  return resp;
};

const mkGuard = (publicKey) => {
  return {
    keys: [publicKey],
    pred: "keys-all",
  };
};

const prepareSigningCmd = (pactCode, data, caps) => {
  const creationTime = Math.floor(new Date().getTime() / 1000);
  const nonce = `${creationTime}`;
  const meta = Pact.lang.mkMeta(
    senderAccount,
    chainId,
    gasPrice,
    gasLimit,
    creationTime,
    3600
  );
  const signers = [
    {
      pubKey: kp.publicKey,
      clist: [],
    },
  ];

  if (caps.length > 0) {
    signers.push({
      pubKey: kp_caps.publicKey,
      clist: caps,
    });
  }

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
    networkId,
  };
};

const signCmd = (cmd, keyPair) =>
  Pact.crypto.sign(JSON.stringify(cmd), keyPair);

export const mkCmd = (pactCode, data, caps) => {
  const signingCmd = prepareSigningCmd(pactCode, data, caps);
  const sig = signCmd(signingCmd, kp);
  const sigs = [sig];

  if (caps.length > 0) {
    sigs.push(signCmd(signingCmd, kp_caps));
  }

  return Pact.api.mkSingleCmd(sigs, JSON.stringify(signingCmd));
};

export const mkCap = (role, description, name, args) => {
  return {
    name,
    args,
  };
};
