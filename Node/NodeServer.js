// Idea for below came from the following:
// 1) Rest API for the practical project section of the "4_practical-project-rest-api.pdf" file
// 2) https://www.tutorialspoint.com/nodejs/nodejs_express_framework.htm
// 3) https://stackoverflow.com/questions/10005939/how-do-i-consume-the-json-post-data-in-an-express-application
// 4) https://alligator.io/nodejs/command-line-arguments-node-scripts

var express = require('express');
var app = express();

var Node = require("./Node");

// The below would represent the Node that will contain the Blockchain.
var node = null;

// Needed to be able to parse JSON Message Body in POST RESTFul Services.
var bodyParser = require('body-parser');
app.use(bodyParser.json())

var GeneralUtilities = require('./GeneralUtilities');

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

// As per Patrick Galloway:
// 1) If there is an error in communications, or if the peer take longer than 60 seconds to respond, the peer should be dropped.
// 2) If I call a peer with ANY RESTFul Web Service and I get back an error or there's no response in 60 seconds, I will drop the peer.
//
// References:
// 1) Node/research/Patrick-Galloway_What-to-do-if-Peer-does=not-respond-or-errors-out.jpg file
// 2) https://medium.com/@masnun/handling-timeout-in-axios-479269d83c68
var restfulCallTimeout = 60000; // 60 seconds or 60000 milliseconds

// This responds with "Hello World" on the homepage
app.get('/', function (req, res) {
   console.log("Got a GET request for the homepage");

   res.end(JSON.stringify({"message" : "Hello GET"}));
});

// General information
// Endpoint for receiving general information about the node.
app.get('/info', (req, res) => {
	let response = node.getGeneralInformation();
	res.end(JSON.stringify(response));
});

// Debug endpoint
// This endpoint will print everything about the node. The blocks, peers, chain, pending transactions and much more.
app.get('/debug', (req, res) => {
	let response = node.getDebugInformation();
	res.end(JSON.stringify(response));
});

// Reset the chain Endpoint
// This endpoint will reset the chain and start it from the beginning; this is used only for debugging.
//
// References:
// 1) Node/research/REST-Endpoints_Debug_Reset-Chain.jpg file
// 2) Section "Reset the chain Endpoint" of the 4_practical-project-rest-api.pdf file
app.get('/debug/reset-chain', (req, res) => {
	let response = node.resetChain();
	res.end(JSON.stringify(response));
});

// All blocks Endpoint
// The endpoint will print all the blocks in the node’s chain.
app.get('/blocks', (req, res) => {
	let response = node.getBlocksInformation();
	res.end(JSON.stringify(response));
});

// Block by Index Endpoint
// The endpoint will print the block with the index that you specify
//
// References:
// 1) Node/research/REST-Endpoints_Block-by-Number.jpg file : States to use /blocks/:index URL
// 2) Section "Block by Index Endpoint" of the Node/research/4_practical-project-rest-api.pdf file : States to use /block/:index URL
//
// The https://stormy-everglades-34766.herokuapp.com website used the /blocks/:index URL so that's the one I will use.
app.get('/blocks/:index', (req, res) => {
	let blockIndex = req.params.index;
	let response = node.getBlockInformation(blockIndex);

	if (response.hasOwnProperty("errorMsg")) {
		res.status(HttpStatus.NOT_FOUND);
	}

	res.end(JSON.stringify(response));
});

// Get Pending Transactions Endpoint
// This endpoint will print the list with transactions that have not been mined.
app.get('/transactions/pending', (req, res) => {
	let response = node.getPendingTransactions();
	res.end(JSON.stringify(response));
});

// Get Confirmed Transactions
// This endpoint will print the list of the transactions that are included in blocks.
app.get('/transactions/confirmed', (req, res) => {
	let response = node.getConfirmedTransactions();
	res.end(JSON.stringify(response));
});

// Get Transaction by Hash Endpoint
// This endpoint will return a transaction identified by hash
app.get('/transactions/:hash', (req, res) => {
	let hash = req.params.hash;
	let response = node.getTransactionGivenTransactionHashId(hash);

	if (response.hasOwnProperty("errorMsg")) {
			res.status(HttpStatus.NOT_FOUND);
	}

	res.end(JSON.stringify(response));
});

// List All Account Balance
// This endpoint will return all the balances in the network.
app.get('/balances', (req, res) => {
	let response = node.listAllAccountBalances();
	res.end(JSON.stringify(response));
});

// List Transactions for Address
// This endpoint will print all transactions for an address in which the address may be either the "from" or "to"
// address in the transaction.
app.get('/address/:address/transactions', (req, res) => {
	let address = req.params.address;
	let response = node.listTransactionsForAddress(address);

	if (response.hasOwnProperty("errorMsg")) {
				res.status(HttpStatus.NOT_FOUND);
	}

	res.end(JSON.stringify(response));
});

// Get Balance for Address Endpoint
// This endpoint will return the balance of a specified address in the network.
//
// Balances Invalid for Address
// If the address is valid but it is not used, return zero for the balance; if it is an invalid address, return an error message.
app.get('/address/:address/balance', (req, res) => {
	let address = req.params.address;
	let response = node.getBalanceForAddress(address);

	if (response.hasOwnProperty("errorMsg")) {
		res.status(HttpStatus.NOT_FOUND);
	}

	res.end(JSON.stringify(response));
});

// The "axios" Node.js library is used to make RESTFul Web Service calls from JavaScript.
// Sources where I found:
// 1) https://www.twilio.com/blog/2017/08/http-requests-in-node-js.html
// 2) https://github.com/axios/axios
async function sendTransactionToAllPeerNodesVia_RESTFulCall(transactionToBroadcast) {
	let peerNodeIds = Array.from(node.peers.keys());
	let peerUrls = Array.from(node.peers.values());

	for (let i = 0; i = peerUrls.length; i++) {
		let peerUrl = peerUrls[i];
		let restfulUrl = peerUrl + "/transactions/send";
		let normalResponse = undefined;
		let errorResponse = undefined;
		await axios.post(restfulUrl, transactionToBroadcast, {timeout: restfulCallTimeout})
		  .then(function (response) {
		    // console.log('response = ', response);
			// console.log('response.data =', response.data);
			// console.log('response.status =', response.status);
			// console.log('response.statusText =', response.statusText);
			// console.log('response.headers =', response.headers);
		    // console.log('response.config =', response.config);

		    normalResponse = response;
		  })
		  .catch(function (error) {
		    // console.log('error =', error);
		    // console.log('JSON.parse(error) =', JSON.parse(error));
		    // console.log('error.toJSON() =', error.toJSON());
		    // console.log('error.response =', error.response);
		    // console.log('error.response.data =', error.response.data);
			// console.log('error.response.status =', error.response.status);
			// console.log('error.response.statusText =', error.response.statusText);
			// console.log('error.response.headers =', error.response.headers);
		    // console.log('error.response.config =', error.response.config);

		    errorResponse = error;
  		});

		// If the RESTFul call to the peer yielded no response after the timeout, then just delete the peer node from the list of "peers".
  		if (normalResponse === undefined && errorResponse === undefined) {
			node.peers.delete(peerNodeIds[i]);
		}
	}
}

// Send Transaction
// With this endpoint, you can broadcast a transaction to the network.
app.post('/transactions/send', (req, res) => {
	let response = node.sendTransaction(req.body);

	if (response.hasOwnProperty("errorMsg")) {
		res.status(HttpStatus.BAD_REQUEST);
	} else {
		sendTransactionToAllPeerNodesVia_RESTFulCall(req.body);

		res.status(HttpStatus.CREATED);
	}

	// res.end(JSON.stringify(response));
	// res.end(response);
	res.json(response);
});

// Get Mining Job Endpoint
// This endpoint will prepare a block candidate and the miner will calculate the nonce for it.
app.get('/mining/get-mining-job/:minerAddress', (req, res) => {
	let minerAddress = req.params.minerAddress;
	let response = node.getMiningJob(minerAddress);

	if (response.hasOwnProperty("errorMsg")) {
			res.status(HttpStatus.BAD_REQUEST);
	}

	res.end(JSON.stringify(response));
});

// RESTFul URL being called --> /peers/notify-new-block
//
// References:
// 1) Section "Notify Peers about New Block Endpoint" of the 4_practical-project-rest-api.pdf file
// 2) Node/research/REST-Endpoints_Notify-Peers-about-New_Block.jpg
//
// The "axios" Node.js library is used to make RESTFul Web Service calls from JavaScript.
// Sources where I found:
// 1) https://www.twilio.com/blog/2017/08/http-requests-in-node-js.html
// 2) https://github.com/axios/axios
async function notifyPeersAboutNewlyMinedBlockVia_RESTFulCall() {
	let peerNodeIds = Array.from(node.peers.keys());
	let peerUrls = Array.from(node.peers.values());

	// Not sure what the "nodeUrl" value should be from the project papers, but it's probably the
	// Node URL of this Node.
	let notificationMessageContents = {
			blocksCount: node.chain.blocks.length,
			cumulativeDifficulty: node.chain.calculateCumulativeDifficulty(),
			nodeUrl: node.selfUrl
	}

	for (let i = 0; i < peerUrls.length; i++) {
		let peerUrl = peerUrls[i];
		let restfulUrl = peerUrl + "/peers/notify-new-block";
		let normalResponse = undefined;
		await axios.post(restfulUrl, notificationMessageContents)
		  .then(function (response) {
		    // console.log('response = ', response);
			// console.log('response.data =', response.data);
			// console.log('response.status =', response.status);
			// console.log('response.statusText =', response.statusText);
			// console.log('response.headers =', response.headers);
		    // console.log('response.config =', response.config);
		  })
		  .catch(function (error) {
		    // console.log('error =', error);
		    // console.log('JSON.parse(error) =', JSON.parse(error));
		    // console.log('error.toJSON() =', error.toJSON());
		    // console.log('error.response =', error.response);
		    // console.log('error.response.data =', error.response.data);
			// console.log('error.response.status =', error.response.status);
			// console.log('error.response.statusText =', error.response.statusText);
			// console.log('error.response.headers =', error.response.headers);
		    // console.log('error.response.config =', error.response.config);
  		});

  		// Should always get a normal response in this context.
  		// If the RESTFul call to the peer yielded no response after the timeout, then just delete the peer node from the list of "peers".
  		if (normalResponse === undefined) {
			node.peers.delete(peerNodeIds[i]);
		}
	}
}

// Submit Block Endpoint
// With this endpoint you will submit a mined block.
app.post('/mining/submit-mined-block', (req, res) => {
	let response = node.submitMinedBlock(req.body);

	if (response.hasOwnProperty("errorMsg")) {
		if (response.errorMsg.startsWith("Bad Request: ")) {
			res.status(HttpStatus.BAD_REQUEST);
		}
		else {
			res.status(HttpStatus.NOT_FOUND);
		}
	}
	else { // Mined Block successfuly placed in Blockchain
		// When a Block has been successguly Mined and placed in the Blockchain, then all peers are
		//   notified about the new mined block.
		// Reference: Node/research/Processing-a-Mined-Block.jpg file
		notifyPeersAboutNewlyMinedBlockVia_RESTFulCall();
	}

	res.end(JSON.stringify(response));
});

// Debug: Mine a Block Endpoint
// With this endpoint you can mine with the difficulty that you want. Use it only for debugging purposes.
//
// References:
// 1) Section "Debug: Mine a Block Endpoint" of the 4_practical-project-rest-api.pdf file
// 2) Node/research/REST-Endpoints_Debug_Mine-a-Block.jpg file
app.get('/debug/mine/:minerAddress/:difficulty', (req, res) => {
	let minerAddress = req.params.minerAddress;
	let difficulty = req.params.difficulty;
	let response = node.debugMineBlock(minerAddress, difficulty);

	if (response.hasOwnProperty("errorMsg")) {
		res.status(HttpStatus.BAD_REQUEST);
	}

	res.end(JSON.stringify(response));
});

// List All Peers Endpoint
// This endpoint will return all the peers of the node.
//
// References:
// 1) Node/research/REST-Endpoints_List-All-Peers.jpg file
// 2) Section "List All Peers Endpoint" of the Node/research/4_practical-project-rest-api.pdf file
app.get('/peers', (req, res) => {
	let response = node.listAllPeers();
	res.end(JSON.stringify(response));
});

// Connect a Peer Endpoint
// With this endpoint, you can manually connect to other nodes.
//
// References:
// 1) Section "Connect a Peer Endpoint" of the 4_practical-project-rest-api.pdf file
// 2) Node/research/REST-Endpoints_Connect-a-Peer.jpg file
// 3) Node/research/REST-Endpoints_Connect-a-Peer_Invalid.jpg file
// 4) Node/research/Connecting-to-a-Peer.jpg file
// 5) Node/research/Synchronizing-the-Chain-and-Pending-Transactions.jpg file
// 6) Node/research/Validating-a-Chain.jpg file
// 7) Node/research/Validating-a-Chain_2.jpg file
app.post('/peers/connect', (req, res) => {
	// Below code would not work, because I had to make the "node.connectToPeer" method asynchronous so I could use
	// "await" inside the "node.connectToPeer" method to wait for the various RESTFul Web Service calls I made using
	// "axios" library.
	/*
	let response = node.connectToPeer(req.body);

	if (response.hasOwnProperty("errorMsg")) {
		if (response.errorType === "Bad Request") {
			res.status(HttpStatus.BAD_REQUEST);
		}
		else if (response.errorType === "Conflict") {
			res.status(HttpStatus.CONFLICT);
		}

		response = { errorMsg: response.errorMsg }
	}

	res.end(JSON.stringify(response));
	*/

    // Used coding technique described in the https://tutorialzine.com/2017/07/javascript-async-await-explained
    // web page to call an Asynchronous fuction and get it's response.
	node.connectToPeer(req.body).then( function(response) {
    	if (response.hasOwnProperty("errorMsg")) {
			if (response.errorType === "Bad Request") {
				res.status(HttpStatus.BAD_REQUEST);
			}
			else if (response.errorType === "Conflict") {
				res.status(HttpStatus.CONFLICT);
			}

			response = { errorMsg: response.errorMsg }
		}

		// console.log('node.connectToPeer response =', response);
		res.end(JSON.stringify(response));
	});
});

// Notify Peers about New Block Endpoint
// This endpoint will notify the peers about a new block.
//
// References:
// 1) Section "Notify Peers about New Block Endpoint" of the 4_practical-project-rest-api.pdf file
// 2) Node/research/REST-Endpoints_Notify-Peers-about-New_Block.jpg
app.post('/peers/notify-new-block', (req, res) => {
	let response = node.notifyPeersAboutNewBlock(req.body);

	if (response.hasOwnProperty("errorMsg")) {
		res.status(HttpStatus.BAD_REQUEST);
	}

	res.end(JSON.stringify(response));
});

var listeningPort = 5555;
var listeningHostNameOrIP_Address = "localhost";

// The "commander" Node.js library was used to easily handle command-line arguments.
var commander = require('commander');
commander
	.usage('[OPTIONS]...')
	.option('-lp, --listeningPort <Port Number>', 'Listening Port Number', listeningPort)
	.option('-lh, --listeningHost <Host Name or IP Address>', 'Listing Host Name or IP Address', listeningHostNameOrIP_Address)
	.parse(process.argv);

if (GeneralUtilities.isNumeric(commander.listeningPort)) {
	listeningPort = commander.listeningPort;
}
else {
	console.log(`Listening Port Argument entered is not a number: Will use default ${listeningPort} port.`);
}

var server = app.listen(listeningPort, function () {
   var host = server.address().address
   var port = server.address().port

   if (host == "::") {
	   host = "localhost";
   }

   node = new Node(host, port);

   console.log("Node Server listening at http://%s:%s", host, port);
});