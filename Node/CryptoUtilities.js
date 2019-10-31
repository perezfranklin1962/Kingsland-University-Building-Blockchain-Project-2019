// This file contains the functions needed to do Private/Public Key Encryption on Addresees and
// Signatures.
//
// Research for coming up with the code below may be seen in the "research/FranklinCryptoUtility.js"
// file.

// require('elliptic')
// npm install -g elliptic <---- DID NOT WORK
// npm install elliptic --save

// require('crypto-js')
// npm install -g crypto-js <---- DID NOT WORK
// npm install crypto-js --save

// Import the elliptic library and initialize a curve.
// Reference --> https://www.savjee.be/2018/10/Signing-transactions-blockchain-javascript
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

// Need to import this to later get RIPEMD-160 of Public Key
// Reference --> https://devstore.io/js/crypto-js
var CryptoJS = require('crypto-js');

// Idea for random generation of Private Key came from the https://www.savjee.be/2018/10/Signing-transactions-blockchain-javascript
// web page. The Private Key is returned back as a 64-digit Hex string.
function generateRandomPrivateKey() {
	let privateKey = ec.genKeyPair().getPrivate('hex');
	while (privateKey[0] == '0') {
		privateKey = ec.genKeyPair().getPrivate('hex');
	}

	return privateKey;
}

// The Public Key returned is obtained from the Private Key. First, yeu get the Public/Private
// key pair from the Private Key String. Then, you get the Public Key (x, y) coordinate from the Key Pair object.
//
// When obtaining a Public Key string from the Key pair object... You take the "x" coordinate value of the Public Key
// and concatenate it at the end with either a "0" or "1" depending upon whether the "y" coordinate value is even or odd.
//
// Ideas to obtain Public Key from Private Key came from following sources:
// 1) https://www.linkedin.com/pulse/how-does-bitcoin-validate-transactions-primer-tom-goldenberg
// 2) https://www.codota.com/code/javascript/functions/elliptic/KeyPair/getPublic
// 3) https://openpgpjs.org/openpgpjs/doc/crypto_public_key_elliptic_key.js.html
// 4) https://familywebcompany.com/customize/node_modules/bignumber.js/doc/API.html#toS
// 5) Investigation research as shown in the FranklinUtility.js file
function getPublicKeyFromPrivateKey(privateKeyString) {
	let keyPair = ec.keyFromPrivate(privateKeyString);

	// Below is the Public Key with it's X and Y ccordinate.
	let keyPairPublic = keyPair.getPublic();

	// Get the below X and Y ccordinate values for the Public Key.
	// They will be in JavaScript BN (BigNumber) object type.
	let publicKey_X = keyPairPublic.getX();
	let publicKey_Y = keyPairPublic.getY();

	// Get the Public Key X coordinate in Hexadecimal String format.
	let publicKey_X_hex_String = publicKey_X.toString(16);
	// let publicKey_Y_hex_String = publicKey_Y.toString(16);

	// Get the Public Key Y coordinate in Binary String format, It will be
	// used later to determine if a 1 or 0 should be concatenated to the "x"
	// coordinate.
	let publicKey_Y_binary_String = publicKey_Y.toString(2);

	// If the last binary digit is "0", then it's even. If the last binary digit is "1", then it's odd.
	// A publicKey_Y_binary_String[publicKey_Y_binary_String.length - 1] value of 0 means it's EVEN.
	// A publicKey_Y_binary_String[publicKey_Y_binary_String.length - 1] value of 1 means it's ODD.
	let returned_publicKeyString = publicKey_X_hex_String + publicKey_Y_binary_String[publicKey_Y_binary_String.length - 1];
	return returned_publicKeyString;
}

// Need to convert the Public Key to the Public Address by taking the RIPEMD-160 of Public Key.
// Reference on HOWTO --> https://cryptojs.gitbook.io/docs
function getPublicAddressFromPublicKey(publicKeyString) {
	let publicAddress = CryptoJS.RIPEMD160(publicKeyString);

	// The "publicAddress" is an Object that needs to be converted to a string. Investigation yieled that
	// it has a "toString()" function that returns back a 40-Hex digit string that is desired from specs of
	// project.
	let publicAddressString = publicAddress.toString();
	return publicAddressString;
}

module.exports = {
	generateRandomPrivateKey,
	getPublicKeyFromPrivateKey,
	getPublicAddressFromPublicKey
};