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
	return privateKey;
}

// The Public Key returned is obtained from the Private Key. First, yeu get the Public/Private
// key pair from the Private Key String. Then, you get the Public Key (x, y) coordinate from the Key Pair object.
//
// When obtaining a Public Key string from the Key pair object... You take the "x" coordinate value of the Public Key
// and concatenate it at the end with either a "0" or "1" depending upon whether the "y" coordinate value is even or odd.
//
// Reference file for Input/Output: Node/research/Keys-and-Addresses_Private-Key_to_Public-Address.jpg
// Input: A 64-Hex Digit string representing a Private Key
// Output: A 65-Hex Digit string representing the Compressed version of the derived Public Key
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

	// Sometimes the Hex string returned is LESS than the 64-Hex string that is expected. So, we need to pad with '0'.
	// Reference HOWTO --> https://stackoverflow.com/questions/10073699/pad-a-number-with-leading-zeros-in-javascript
	publicKey_X_hex_String = publicKey_X_hex_String.padStart(64, '0');

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

	// The "publicAddress" is an Object that needs to be converted to a string. Investigation yielded that
	// it has a "toString()" function that returns back a 40-Hex digit string that is desired from specs of
	// project.
	let publicAddressString = publicAddress.toString();
	return publicAddressString;
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

// Creates a Signature from the input "message" string and "privateKey" 64-hex string.
//
// Inputs:
// 1) message: any string value
// 2) privateKey: privateKey of a Public Address that is in 64-hex string format as described in the
//    Node/research/Keys-and-Addresses_Private-Key_to_Public-Address.jpg file.
//
// Output: A Signature JavaScript object that has the following two main attributes:
// 1) r : 64-Hex string of the Signature "r" attribute
// 2) s : 64-Hex string of the Signature "s" attribute
// Reference on HOWTO --> https://www.linkedin.com/pulse/how-does-bitcoin-validate-transactions-primer-tom-goldenberg
function createSignature(message, privateKey) {
	let privateKeyPair = ec.keyFromPrivate(privateKey);
  	let signature = ec.sign(message, privateKeyPair);

  	// Sometimes the Hex string returned is LESS than the 64-Hex string that is expected. So, we need to pad with '0'.
  	// Reference HOWTO --> https://stackoverflow.com/questions/10073699/pad-a-number-with-leading-zeros-in-javascript
  	let signature_r_string = signature.r.toString(16).padStart(64, '0');
  	let signature_s_string = signature.s.toString(16).padStart(64, '0');

  	let signatureObject = {r: signature_r_string, s: signature_s_string};
  	return signatureObject;
}

// Converts a "publicKeyCompressedString" in 65-hex compressed string format as explained in the
// Node/research/Keys-and-Addresses_Private-Key_to_Public-Address.jpg file (and obtained as shown in the
// "getPublicKeyFromPrivateKey" method) and converts it into an EC Point JavaScript object that has "x" and "y" coordinate
// attributes.
//
// Sample console.log output of this function when running the Node/research/FranklinCryptoUtility.js program:
//    publicKeyCompressedString = 2dcecd388173cd98dc51ee6548bacd3e50a59934fae38119d215f7275727c4980
//      publicKeyUncompressed = <EC Point x: 2dcecd388173cd98dc51ee6548bacd3e50a59934fae38119d215f7275727c498 y: b1fc99127d0c0a7f3da9aa1f3549563ec017df6a8bfc7ff32c11a49b4cb1fed0>
//      publicKeyUncompressed.x = <BN-R: 2dcecd388173cd98dc51ee6548bacd3e50a59934fae38119d215f7275727c498>
//      publicKeyUncompressed.x.toString(16) = 2dcecd388173cd98dc51ee6548bacd3e50a59934fae38119d215f7275727c498
//      typeof publicKeyUncompressed.x = object
//      publicKeyUncompressed.y.toString(16) = b1fc99127d0c0a7f3da9aa1f3549563ec017df6a8bfc7ff32c11a49b4cb1fed0
//      typeof publicKeyUncompressed.y = object
//
// References on HOWTO:
// 1) https://npmdoc.github.io/node-npmdoc-elliptic/build/apidoc.html#apidoc.element.elliptic.curve.edwards.prototype.pointFromX
// 2) http://yourjavascript.com/uploaded/file.php?i=1505743138&f=elliptic.js.html
function convertCompressedPublicKeyToUncompressed(publicKeyCompressedString) {
	// console.log('publicKeyCompressedString =', publicKeyCompressedString);
	let publicKey_X_string = publicKeyCompressedString.substring(0, 64);
	let zeroOrOneString = publicKeyCompressedString[64];
	let publicKeyUncompressed = ec.curve.pointFromX(publicKey_X_string, zeroOrOneString === '1');

	/*
	console.log('publicKeyUncompressed =', publicKeyUncompressed);
	console.log('   publicKeyUncompressed.x =', publicKeyUncompressed.x);
	console.log('   publicKeyUncompressed.x.toString(16) =', publicKeyUncompressed.x.toString(16))
	console.log('   typeof publicKeyUncompressed.x =', typeof publicKeyUncompressed.x);
	console.log('   publicKeyUncompressed.y.toString(16) =', publicKeyUncompressed.y.toString(16));
	console.log('   typeof publicKeyUncompressed.y =', typeof publicKeyUncompressed.y);
	*/

	return publicKeyUncompressed;
}

// Verifies the "signature" of the given "message" string to make sure that the given "publicKeyCompressedStr" signed the
// given "message" with the given "signature".
//
// Inputs:
// 1) message: any string value
// 2) publicKeyCompressedStr : This is the Public Key in 65-hex compressed string format as explained in the
//    Node/research/Keys-and-Addresses_Private-Key_to_Public-Address.jpg file (and obtained as shown in the
//    "getPublicKeyFromPrivateKey" method)
// 3) signature: A Signature JavaScript object that has the following two attributes:
//    a) r : 64-Hex string of the Signature "r" attribute
//    b) s : 64-Hex string of the Signature "s" attribute
//
// The "signature" input would be the JavaScript object that is produced by the "createSignature" method.
//
// Output: It's is a boolean "true" or "false" depending upon the following criteria:
// 1) true : The given "publicKeyCompressedStr" signed the given "message" with the given "signature"
// 2) false : The given "publicKeyCompressedStr" DID NOT sign the given "message" with the given "signature"
//
// Reference on HOWTO --> https://www.linkedin.com/pulse/how-does-bitcoin-validate-transactions-primer-tom-goldenberg
function verifySignature(message, publicKeyCompressedStr, signature) {
	let publicKey = convertCompressedPublicKeyToUncompressed(publicKeyCompressedStr);
  	let publicKeyPair = ec.keyFromPublic(publicKey, 'hex'); // use the accessible public key to verify the signature
  	let isVerified = publicKeyPair.verify(message, signature);
  	return isVerified;
}

module.exports = {
	generateRandomPrivateKey,
	getPublicKeyFromPrivateKey,
	getPublicAddressFromPublicKey,
	createSignature,
	convertCompressedPublicKeyToUncompressed,
	verifySignature
};
