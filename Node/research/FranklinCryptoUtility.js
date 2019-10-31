// Purpose of this file is to show the research work done in determining the coding of the
// various functions needed for the Public/Private Key Encryption from the specs shown
// in the "" file.

// The purpose of this file is for test purposes to test out how to code the part of the
// Project that deals with Public/Private Key encryption.

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
// web page.
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

let privateKey = generateRandomPrivateKey();
console.log();
console.log('Your private key', privateKey);
console.log('  Private Key Length: ', privateKey.length);

// Idea to for below came from the https://www.linkedin.com/pulse/how-does-bitcoin-validate-transactions-primer-tom-goldenberg
// web page.
console.log();
let keyPair = ec.keyFromPrivate(privateKey);
console.log(JSON.stringify(keyPair));

// Reference --> https://www.codota.com/code/javascript/functions/elliptic/KeyPair/getPublic
console.log();
let keyPairPublic = keyPair.getPublic();
console.log(JSON.stringify(keyPairPublic));

// Reference --> https://openpgpjs.org/openpgpjs/doc/crypto_public_key_elliptic_key.js.html
console.log();
let publicKey_X = keyPairPublic.getX();
let publicKey_Y = keyPairPublic.getY();
console.log('Public Key X = ', publicKey_X);
console.log('Public Key Y = ', publicKey_Y);

// From above, I conclude that keyPairPublic[0] is the X ccordinate and keyPairPublic[1] is the Y coordinate.
// Below output is not what I expect. So, will try instead to convert the JavaScript BN from the publicKey_X and
// publicKey_Y to a string.
console.log();
let keyPairPublic_JSON = JSON.stringify(keyPairPublic);
console.log(keyPairPublic_JSON);
console.log(keyPairPublic_JSON[0]);
console.log(keyPairPublic_JSON[1]);
console.log('Public Key X = keyPairPublic[0] = ', keyPairPublic_JSON[0]);
console.log('Public Key Y = keyPairPublic[1] = ', keyPairPublic_JSON[1]);

// Below Reference to convert BigNumber to Base 16 or Base 2 String
// Reference --> https://familywebcompany.com/customize/node_modules/bignumber.js/doc/API.html#toS
console.log();
let publicKey_X_hex_String = publicKey_X.toString(16);
let publicKey_Y_hex_String = publicKey_Y.toString(16);
let publicKey_Y_binary_String = publicKey_Y.toString(2);
console.log('publicKey_X_hex_String = ', publicKey_X_hex_String);
console.log('  publicKey_X_hex_String length = ', publicKey_X_hex_String.length);
console.log('publicKey_Y_hex_String = ', publicKey_Y_hex_String);
console.log('  publicKey_Y_hex_String length = ', publicKey_Y_hex_String.length);
console.log('publicKey_Y_binary_String = ', publicKey_Y_binary_String);
console.log('  publicKey_Y_binary_String length = ', publicKey_Y_binary_String.length);

// Determining if Public Key is is even or odd.
console.log();
if (publicKey_Y_binary_String[publicKey_Y_binary_String.length - 1] == "0") {
	console.log("publicKey_Y is EVEN");
}
else {
	console.log("publicKey_Y is ODD");
}

console.log();
let publicKeyString = getPublicKeyFromPrivateKey(privateKey);
console.log('publicKeyString = ', publicKeyString);
console.log('   publicKeyString.length = ', publicKeyString.length);

console.log();
let publicAddress = CryptoJS.RIPEMD160(publicKeyString);
console.log('publicAddress = ', publicAddress);
let publicAddressString = publicAddress.toString();
console.log('publicAddressString = ', publicAddressString);
console.log('   publicAddressString.length = ', publicAddressString.length);

console.log();
let publicAddressString_2 = getPublicAddressFromPublicKey(publicKeyString);
console.log('publicAddressString_2 = ', publicAddressString_2);
console.log('   publicAddressString_2.length = ', publicAddressString_2.length);


console.log();
