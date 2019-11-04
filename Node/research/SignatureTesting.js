var CryptoJS = require('crypto-js');
var CryptoUtilities = require('../CryptoUtilities');
var Transaction = require('../Transaction');

let transactionDataToHashJson = {
		'from': "fce3a061a500b8f3fb10eb29a55f24941f7444de",
		'to': "b63a0fe3f5f5ffc6a800f51594eee600082ad57f",
		'value': 150,
		'fee': 10,
		'dateCreated': "2019-11-04T01:39:28.921Z",
		'data': "",
		'senderPubKey': "975be465d4c8a8dd60335188766e83cf4a5bf61a6a3bf6ea2b51076c53f41c0d0"
	};

let transactionDataToHashJsonString = JSON.stringify(transactionDataToHashJson);
console.log('transactionDataToHashJsonString =', transactionDataToHashJsonString);
console.log();

// JSON stringify string are exactly the same for both!
/*
transactionDataToHashJson = {
		from: "60",
		to: "90",
		value: 15,
		fee: 12,
		dateCreated: "My Date",
		data: "",
		senderPubKey: "My Public Key"
	};

let transactionDataToHashJsonString_Two = JSON.stringify(transactionDataToHashJson);
console.log(transactionDataToHashJsonString_Two);
console.log();
*/

let transactionDataHash = CryptoJS.SHA256(transactionDataToHashJsonString);
console.log('transactionDataHash =', transactionDataHash);
let transactionDataHashString = transactionDataHash.toString();
console.log('transactionDataHashString =', transactionDataHashString);
console.log();

let senderPrivateKey = "37fa69286acb4c45b9c4331d192910d91482d5c8628ae10d56c23d9f2d184aee";
let senderSignature = CryptoUtilities.createSignature(transactionDataHashString, senderPrivateKey);
console.log('senderSignature =', senderSignature);
console.log();



