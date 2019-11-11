// Create the Express app
const express = require("express");
const app = express();

// NOTE: The "cors" belos is NOT needed, because we only want browsers located in "localhost" to execute
// the below /getCoins POST. That way, if someone OUTSIDE of the computer tries to execute the below RESTFul
// Web Service directly, he/she will not be able to do so. It can ONLY be executed from the "index.html" file in
/// Node.js server mode.
//
// The "cors" Node.js module is needed so that RESTFul GET and POST calls to the Node Server can be done successfully
// from any browser as explained in the https://flaviocopes.com/cors web page.
//
// Tried to use "npm install -g cors" to install globally. It successfully installed globally, but
// when I ran "node Node/research/NodeIdTest.js", the Node program could not find the global location. What worked was
// the "npm install cors --save" command.
//
// References:
// 1) https://flaviocopes.com/cors
// 2) https://github.com/expressjs/cors
// var cors = require('cors');
// app.use(cors()); // allows all RESTFul GET and POST calls to be made from any browser

// Enable JSON data in the HTTP request body
const bodyParser = require("body-parser");
app.use(bodyParser.json());

// As per Patrick Galloway:
// 1) If there is an error in communications, or if the peer takes longer than 60 seconds to respond, the peer should be dropped.
// 2) If I call a peer with ANY RESTFul Web Service and I get back an error or there's no response in 60 seconds, I will drop the peer.
//
// References:
// 1) Node/research/Patrick-Galloway_What-to-do-if-Peer-does=not-respond-or-errors-out.jpg file
// 2) https://medium.com/@masnun/handling-timeout-in-axios-479269d83c68
var restfulCallTimeout = 60000; // 60 seconds or 60000 milliseconds

// References:
// 1) https://stackoverflow.com/questions/18765869/accessing-http-status-code-constants
// 2) https://github.com/prettymuchbryce/http-status-codes
//
// Tried to use "npm install -g http-status-codes" to install globally. It successfully installed globally, but
// when I ran "node Node/research/NodeIdTest.js", the Node program could not find the global location. What worked was
// the "npm install http-status-codes --save" command.
var HttpStatus = require('http-status-codes');

// The "axios" Node.js library is used to make RESTFul Web Service calls from JavaScript.
// Sources where I found:
// 1) https://www.twilio.com/blog/2017/08/http-requests-in-node-js.html
// 2) https://github.com/axios/axios
var axios = require('axios');

var CryptoUtilities = require('./CryptoUtilities');
var Transaction = require('./Transaction');
var GeneralUtilities = require('./GeneralUtilities');

// var faucetPrivateKey = '37fa69286acb4c45b9c4331d192910d91482d5c8628ae10d56c23d9f2d184aee';
var faucetPrivateKey = undefined;

// Enable static access to the "/public" folder
app.use(express.static('../public'));

// Utility function to send Trasnactiom asynchronously.
async function sendTransaction(signedTransactionJson, nodeIdUrl, res) {
	let restfulUrl = nodeIdUrl + "/transactions/send";
	let restfulSuccessfulResponse = undefined;
	let restfulErrorResponse = undefined;

	console

	await axios.post(restfulUrl, signedTransactionJson, {timeout: restfulCallTimeout})
		.then(function (response) {
			// console.log('response = ', response);
			// console.log('response.data =', response.data);
			// console.log('response.status =', response.status);
			// console.log('response.statusText =', response.statusText);
			// console.log('response.headers =', response.headers);
			// console.log('response.config =', response.config);
			restfulSuccessfulResponse = response.data;
		})
		.catch(function (error) {
			// console.log('error =', JSON.stringify(error, undefined, 2));
			// console.log('error.response =', error.response);

			// When in browser, to get the response body, you must get it from the "error.response" or else
			// you will not be able to get it outside of here.
			//
			// Reference ---> https://github.com/axios/axios/issues/960
			if (error.response === undefined) {
				restfulErrorResponse = error;
			}
			else {
				restfulErrorResponse = error.response;
			}
  		});

  	let response = {
			errorMsg: '',
			displaySendTransactionInfo: ''
	}
  	let errorMessage = undefined;

  	console.log('async function sendTransaction: restfulSuccessfulResponse =', restfulSuccessfulResponse);
  	console.log('async function sendTransaction: restfulErrorResponse  =', restfulErrorResponse);

	// If the RESTFul call to Blockchain Node yielded no response after the timeout, then just display an error message.
	if (restfulSuccessfulResponse === undefined && restfulErrorResponse === undefined) {
		response.errorMsg = `Attempt to call ${restfulUrl } to send transaction failed due to timeout - unable to ` +
			`send the transaction.`;

		response = { errorMsg: errorMessage };
		res.status(HttpStatus.NOT_FOUND);
	}
	else if (restfulErrorResponse !== undefined) {

		res.status(HttpStatus.NOT_FOUND);

		response.errorMsg = `Attempt to call ${restfulUrl } to send transaction failed due to error encountered - unable to ` +
			`send the transaction.`;
		if (restfulErrorResponse.errno === 'ECONNREFUSED') {
			response.errorMsg += ` This was most probably due to a connection problem when attempting to connect to the ${nodeIdUrl} Blockchain Node. ` +
				`Please check your connection to the ${nodeIdUrl} Blockchain Node and see if it's possble to connect. Perhaps the ` +
				`${nodeIdUrl} Blockchain Node is down.`

			console.log('restfulErrorResponse.Error = ', restfulErrorResponse.Error);

			response.displaySendTransactionInfo = JSON.stringify({
				Error: restfulErrorResponse.Error,
				errno: restfulErrorResponse.errno,
				code: restfulErrorResponse.code
			});
		}

		// Technique to prettify obtained from the https://coderwall.com/p/buwfjw/pretty-print-json-with-native-javascript
		// web page.
		console.log('Franklin_2 restfulErrorResponse =', restfulErrorResponse);
		// response.displaySendTransactionInfo = JSON.stringify(restfulErrorResponse, undefined, 2); // caused exceptions

		if (restfulErrorResponse.data !== undefined) {
			response.displaySendTransactionInfo = "Error Status: " + restfulErrorResponse.status + "\n" +
				"Error Status Description: " + restfulErrorResponse.statusText + "\n\n" +
				"Error Message Details: \n";

			console.log('Franklin_2 restfulErrorResponse.data =', restfulErrorResponse.data);

			if (restfulErrorResponse.data.errorMsg !== undefined) {
				console.log('Franklin_2 restfulErrorResponse.data.errorMsg =', restfulErrorResponse.data.errorMsg);
				response.displaySendTransactionInfo += restfulErrorResponse.data.errorMsg;
			}
			else {
				response.displaySendTransactionInfo += JSON.stringify(restfulErrorResponse.data, undefined, 2);
			}

			res.status(restfulErrorResponse.status);
		}

	}
	else { // restfulSuccessfulResponse !== undefined
		let displaySendTransactionInfo = "Transaction successfully sent and placed in Pending Transactions List. \n" +
				"Transaction Hash: " + restfulSuccessfulResponse.transactionDataHash + "\n\n" +
				"Please go to " + nodeIdUrl + "/transactions/" + restfulSuccessfulResponse.transactionDataHash +
				" to get the most current status of your Transaction. Eventually, your Transaction will be confirmed.";

		response = { message: displaySendTransactionInfo };
	}

	console.log('function sendTransaction response =', response);

	return response;
}

app.post('/getCoins', (req, res) => {
	console.log('req.body =', req.body);

	// Will not bother to check validity of the "req.body" parameters, because thay were done by the "faucet-client.js"
	// script and ONLY the "faucet-client.js" will be able to access this RESTFul Web Service.

	let faucetPublicKey = CryptoUtilities.getPublicKeyFromPrivateKey(faucetPrivateKey).padStart(65, '0');;
	let faucetPublicAddress = CryptoUtilities.getPublicAddressFromPublicKey(faucetPublicKey).padStart(40, '0');

	// Transaction constructor below automatically calculates the Transaction Data Hash based on the
	// input parameters to the constructor.
	let dateCreated = new Date().toISOString();
	let transactionToSign = new Transaction(
			faucetPublicAddress, // address (40 hex digits) string
			req.body.recipientPublicAddress, // address (40 hex digits) string
			req.body.amountToSendValue, // integer (non negative)
			req.body.feeAmountToSend, // integer (non negative)
			dateCreated, // ISO8601_string
			"", // data string (optional)
			faucetPublicKey); // hex_number[65] string

	// Sign the Transaction to Send and get it's signature.
	//
	// Output: A Signature JavaScript object that has the following two main attributes:
	// 1) r : 64-Hex string of the Signature "r" attribute
	// 2) s : 64-Hex string of the Signature "s" attribute
	let signature = CryptoUtilities.createSignature(transactionToSign.transactionDataHash, faucetPrivateKey);
	let senderSignatureArray = [ signature.r, signature.s ];

	let signedTransactionJson = {
			from: transactionToSign.from,
			to: transactionToSign.to,
			value: transactionToSign.value,
			fee: transactionToSign.fee,
			dateCreated: transactionToSign.dateCreated,
			data: transactionToSign.data,
			senderPubKey: transactionToSign.senderPubKey,
			senderSignature: senderSignatureArray
	};

	sendTransaction(signedTransactionJson, req.body.blockchainNodeFaucet, res)
		.then( function(response) {
			console.log('app_post_send_transaction response =', response);
		    res.json(response);
		})
		.catch(function (error) { // Any errors will be caught by the "sendTransaction" method so
		                          // very unlikely this error below will get executed.
			// console.log('error =', JSON.stringify(error, undefined, 2));
			console.log('app_post_send_transaction error =', error);
			console.log('app_post_send_transaction error.response =', error.response);

			if ( error.response !== undefined) {
				res.json(error.response);
			}
			else {
				res.json(error);
			}

  		});
});

// The "commander" Node.js library was used to easily handle command-line arguments.
var commander = require('commander');
commander
	.usage('[OPTIONS]...')
	.option('-fa, --faucetPrivateKey <Faucet Private Key>', 'Faucet Private Key (64-Hex lowercase digits)')
	.parse(process.argv);

faucetPrivateKey = commander.faucetPrivateKey;

if (faucetPrivateKey === undefined) {
	console.log('The --faucetPrivateKey is a manadory input parameter. Please re-run Faucet Server and enter a ' +
		'valid Faucet Private Key (64-Hex lowercase digits)...');
	process.exit(1);
}

faucetPrivateKey = faucetPrivateKey.toLowerCase();

if (!GeneralUtilities.isValid_64_Hex_string(faucetPrivateKey)) {
	listeningPort = commander.listeningPort;
	console.log('The --faucetPrivateKey value that you entered is not a valid 64-Hex lowercase string. Please re-run ' +
		'Faucet Server and enter a valid Faucet Private Key (64-Hex lowercase digits)...');
	process.exit(1);
}

const server = app.listen(7777, function(){
    console.log('Server started: http://localhost:' + server.address().port);
});
