const bitcoin = require("bitcoinjs-lib");
const {
  PublicKey,
  Address,
  Networks,
  PrivateKey,
  Transaction,
} = require("bitcore-lib");
const { UnspentOutput } = require("bitcore-lib/lib/transaction");

const ecpair = require("ecpair");

const ecc = require("tiny-secp256k1");

const ECPair = ecpair.ECPairFactory(ecc);

const token = "d588e6e58f0845e2a59481f997ffdfeb"; //blockcypher token

// Network configuration (mainnet or testnet)
const network = bitcoin.networks.testnet; // Change to bitcoin.networks.bitcoin for mainnet
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const btcSend2 = async (fromAddress, toAddress, wif, sendAmount) => {
  // sendAmount = sendAmount * 1e8; //convert to sathoshi
  let fkeyPair = ECPair.fromWIF(wif, network);
  let result = await fetch(
    `https://api.blockcypher.com/v1/btc/test3/addrs/${fromAddress}/full?limit=20&unspentOnly=true`
  );
  result = await result.json();
  console.log(result);
  console.log("------------------1--------------------");
  let balance = result.final_balance;
  console.log("fromAddress balance:", balance);
  // Example of creating a new transaction with Psbt
  const psbt = new bitcoin.Psbt({ network: bitcoin.networks.testnet });

  for (const latestTx of result.txs) {
    const lastestTxHash = latestTx.hash;

    // let resultTrx = await fetch(
    //   `https://api.blockcypher.com/v1/btc/test3/txs/${lastTxHash}`
    // );
    // resultTrx = await resultTrx.json();
    console.log("transaction: ", lastestTxHash);

    // Find the correct voutIndex
    let voutIndex = -1;
    let redeemScript = "";
    let outputValue = 0;
    console.log(">>>>>>>>>>>>>length: ", latestTx.outputs.length);
    for (let i = 0; i < latestTx.outputs.length; i++) {
      let output = latestTx.outputs[i];
      console.log(">>>>>>>>>>>>>length: ", output);

      console.log("address", output.addresses);
      if (output.addresses && output.addresses.includes(fromAddress)) {
        if (output.spent_by && output.spent_by.length > 0) {
          break;
        }
        voutIndex = i;
        redeemScript = output.script;
        outputValue = output.value;
        break;
      }
    }
    if (voutIndex === -1) {
      // throw new Error(
      //   "No output to the fromAddress found in the latest transaction"
      // );
      console.log(
        "No output to the fromAddress found in the latest transaction"
      );
      continue;
    }
    console.log("------------------4--------------------");

    console.log(voutIndex, "voutIndex");
    //adding your input
    psbt.addInput({
      hash: lastestTxHash,
      index: voutIndex,
      // nonWitnessUtxo: Buffer.from(latestTx.hex, "hex"),
      witnessUtxo: {
        script: Buffer.from(redeemScript, "hex"),
        value: outputValue,
      },
    });
    // first parameter in below method is the index of the input to be signed.
  }
  console.log(psbt);

  psbt.addOutput({
    address: toAddress,
    value: sendAmount,
  });
  // Estimate the transaction size without adding outputs

  // const preOutputVsize =
  //   psbt.data.inputs.length * 141 + (psbt.data.outputs.length + 1) * 34 + 10; // Simplified estimation
  const preOutputVsize = psbt.data.inputs.length * 141; // Simplified estimation

  const fee = preOutputVsize; //for 141vB

  const changeAmount = sendAmount + fee;

  let whatIsLeft = balance - changeAmount;
  console.table({ whatIsLeft });
  if (whatIsLeft < 0) {
    whatIsLeft = balance - changeAmount;
  }
  console.table({
    // redeemScript,
    balance,
    // outputValue,
    changeAmount,
    whatIsLeft,
  });
  console.log("------------------5--------------------");
  psbt.addOutput({
    address: fromAddress, // Change address, or same as fromAddress if sending the change back
    value: whatIsLeft,
  });
  //sign all
  for (let i = 0; i < psbt.data.inputs.length; i++) {
    psbt.signInput(i, fkeyPair);
  }
  psbt.finalizeAllInputs();

  let serializedTx = psbt.extractTransaction().toHex();

  console.log(serializedTx, serializedTx.length);

  // return serializedTx;

  try {
    // Broadcast the transaction to the network
    let res = await fetch(
      `https://api.blockcypher.com/v1/btc/test3/txs/push?token=${token}`,
      {
        // Adding method type
        method: "POST",

        // Adding body or contents to send
        body: JSON.stringify({
          tx: serializedTx,
        }),
      }
    );

    res = await res.json();
    console.log(res, "after transaction");
    return res?.tx.hash;
  } catch (error) {
    console.log("error while bitcoin ", error);
  }
};
const bitcoinSend = async (privateKey, to, amount) => {
  const privateKey2 = new PrivateKey(privateKey);

  const publicKey = new PublicKey(privateKey2);
  let address = new Address(
    publicKey,
    Networks.testnet,
    Address.PayToWitnessPublicKeyHash
  );
  const fromAddress = address.toString();
  console.log(address.toString(), address.isPayToWitnessPublicKeyHash());
  let result = await fetch(
    `https://api.blockcypher.com/v1/btc/test3/addrs/${fromAddress}/full?limit=20`
  );
  result = await result.json();
  console.log(result);
  let utxos = [];
  for (const latestTx of result.txs) {
    // if (latestTx.confirmations === 0) {
    //   continue;
    // }
    const lastestTxHash = latestTx.hash;

    // let resultTrx = await fetch(
    //   `https://api.blockcypher.com/v1/btc/test3/txs/${lastTxHash}`
    // );
    // resultTrx = await resultTrx.json();
    console.log("transaction: ", lastestTxHash);

    // Find the correct voutIndex
    let voutIndex = -1;
    let redeemScript = "";
    let outputValue = 0;
    console.log(">>>>>>>>>>>>>length: ", latestTx.outputs.length);
    for (let i = 0; i < latestTx.outputs.length; i++) {
      let output = latestTx.outputs[i];

      console.log("address", output);
      if (output.addresses && output.addresses.includes(fromAddress)) {
        if (output.spent_by && output.spent_by.length > 0) {
          break;
        }
        voutIndex = i;
        redeemScript = output.script;
        outputValue = output.value;
        break;
      }
    }
    if (voutIndex === -1) {
      // throw new Error(
      //   "No output to the fromAddress found in the latest transaction"
      // );
      console.log(
        "No output to the fromAddress found in the latest transaction"
      );
      continue;
    }
    
    console.log("------------------4--------------------");
    console.table({ lastestTxHash, redeemScript, outputValue });
    //input
    const utxo = new UnspentOutput({
      txid: lastestTxHash,
      outputIndex: voutIndex,
      address: fromAddress,
      script: redeemScript,
      satoshis: outputValue,
    });
    utxos = [...utxos, utxo];
    break;
  }
  const fee = 148 * utxos.length + 500;
  //output
  const transaction = new Transaction()
    .from(utxos)
    // .to(to, amount)
    .change(fromAddress)
    .fee(fee)
    .sign(privateKey2);
  const serializedTx = transaction.toString();
  const ob = transaction.toJSON();
  console.log(ob, ob.inputs[0].output, serializedTx);

  return serializedTx;
  try {
    // Broadcast the transaction to the network
    let res = await fetch(
      `https://api.blockcypher.com/v1/btc/test3/txs/push?token=${token}`,
      {
        // Adding method type
        method: "POST",

        // Adding body or contents to send
        body: JSON.stringify({
          tx: serializedTx,
        }),
      }
    );

    res = await res.json();
    console.log(res, "after transaction");
    return res?.tx?.hash;
  } catch (error) {
    console.log("error while bitcoin ", error);
  }
};
module.exports = {
  btcSend2,
  bitcoinSend,
};
