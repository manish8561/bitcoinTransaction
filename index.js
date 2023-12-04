const bitcoin = require("bitcoinjs-lib");

const { btcSend2, bitcoinSend } = require("./utility");
const ecpair = require("ecpair");

const ecc = require("tiny-secp256k1");
const ECPair = ecpair.ECPairFactory(ecc);

// creating the wallet
const createWallet = () => {
  const network = bitcoin.networks.testnet;

  // Generate a key pair for the testnet
  const keyPair = ECPair.makeRandom({
    network,
  });

  // Get the bech32-encoded SegWit address
  const address = bitcoin.payments.p2wpkh({
    pubkey: keyPair.publicKey,
    network,
  }).address;
  console.log("Testnet Address:", address);
  console.log("Private Key:", keyPair.toWIF());
  return {
    address,
    wif: keyPair.toWIF(),
    // privateKey: keyPair.generatePrivateKey(),
    // publicKey: keyPair.getPublicKey(),
  };
};

// Array of Bitcoin wallet addresses to monitor
const walletAddresses = [
  "tb1qcn8f95wvlq9w3ckf60kewls3hd5feynmr4qpqu",
  // "tb1qmtcw22gk84krukyyq2pn0x60l0u0u20gnsghkk",
];

// The URL of the blockchain API service (e.g., Blockchair, Blockcypher)
// const apiURL = `https://api.blockchair.com/bitcoin/dashboards/address/`;
const apiURL = `https://api.blockcypher.com/v1/btc/test3/addrs/`;

// Function to check for incoming transactions for a specific address
async function checkIncomingTransactions(address) {
  // const addressURL = `${apiURL}${address}?erc20=true`;
  const addressUrl = `${apiURL}/${address}`;

  let res = await fetch(addressUrl);
  res = await res.json();

  if (res && res.txrefs) {
    console.log(`Incoming transactions detected for address ${address}:`);
    console.log("transaction count: ", res.txrefs.length);
    for (const transaction of res.txrefs) {
      console.log(`Transaction Hash: ${transaction.tx_hash}`);
      console.log(
        `Amount: ${transaction.value} satoshi and ${
          transaction.value / 1e8
        } btc`
      );
      if (transaction.value > 1) {
        console.log("send trx");
      }
      console.log("---");
    }
  } else {
    console.log(`No incoming transactions for address ${address}`);
  }
}

// Set an interval to check for incoming transactions for each address
// for (const address of walletAddresses) {
//   setInterval(() => {
//     checkIncomingTransactions(address);
//   }, 60000); // Check every 1 minute2
// }

// const r = createWallet();
// console.log("address:   ", r);

const a = async () => {
  const r = await bitcoinSend(
    "feb78563c5053afdf01688ec09c874522d5631918771c7670406e85651256162",
    "mmj9KEEjLmWjL8MKEyz4X2FqNvihFXfFXX",
    1000
  );
  // const r = await btcSend2(
  //   "tb1qmtcw22gk84krukyyq2pn0x60l0u0u20gnsghkk",
  //   "tb1qsyxzn0hk5clfqykatw6qumjahgnvrysdhq96zk",
  //   "cSkBRwfnsfMjSFNTkn5qQN8JCTqyRN2E579CxQ68PuYFxRWR2Avc",
  //   1000
  // );
  console.log("index file::::: ", r);
};
a();
