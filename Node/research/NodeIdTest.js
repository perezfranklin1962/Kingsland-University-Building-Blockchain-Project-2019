// Need below to do a HASH-512
var CryptoJS = require('crypto-js');

// Identifier of the node (hash of Datetime + some random): Will interpret this as meaning to to be:
//    HASH(Datetime + some random number)
// Will use the SHA-512 Hash from the "crypto-js" Node.js library documented in the https://cryptojs.gitbook.io/docs
//    web page.
//

// For the Datetime, will use the "new Date().toISOString()" as explained in the
// https://www.geeksforgeeks.org/javascript-date-toisostring-function web page.
let dateTime = new Date();
let dateTimeString = dateTime.toISOString();
console.log('dateTimeString =', dateTimeString);

// Will generate random Number using the Math.random() with Math.floor() as documented in the
// https://www.w3schools.com/js/js_random.asp web page.
let randomNumberString = Math.floor(Math.random() * 99999999999999999);
console.log('randomNumberString = ', randomNumberString);

let concatenatedString = dateTimeString + randomNumberString;
console.log('concatenatedString =', concatenatedString);

console.log();

let nodeId = CryptoJS.SHA512(concatenatedString);
console.log('nodeId =', nodeId);
let nodeIdString = nodeId.toString();
console.log('nodeIdString = ', nodeIdString);