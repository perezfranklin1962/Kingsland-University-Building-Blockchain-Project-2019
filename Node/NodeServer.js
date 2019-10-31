// Idea for below came from the following:
// 1) Rest API for the practical project section of the "4_practical-project-rest-api.pdf" file
// 2) https://www.tutorialspoint.com/nodejs/nodejs_express_framework.htm
// 3) https://stackoverflow.com/questions/10005939/how-do-i-consume-the-json-post-data-in-an-express-application
// 4) https://alligator.io/nodejs/command-line-arguments-node-scripts

var express = require('express');
var app = express();

var Node = require("./Node");

function isNumeric(value) {
    return /^\d+$/.test(value);
}

// The below would represent the Node that will contain the Blockchain.
var node = null;

// Needed to be able to parse JSON Message Body in POST RESTFul Services.
var bodyParser = require('body-parser');
app.use(bodyParser.json())

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
app.get('/reset-chain', (req, res) => {
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
app.get('/block/:index', (req, res) => {
	let blockIndex = req.params.index;
	let response = node.getBlockInformation(blockIndex);
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
	res.end(JSON.stringify(response));
});

// List Transactions for Address
// This endpoint will print all transactions for an address in which the address may be either the "from" or "to"
// address in the transaction.
app.get('/address/:address/transactions', (req, res) => {
	let address = req.params.address;
	let response = node.listTransactionsForAddress(address);

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
	res.end(JSON.stringify(response));
});

// Send Transaction
// With this endpoint, you can broadcast a transaction to the network.
app.post('/transactions/send', (req, res) => {
	let response = node.sendTransaction(req.body);
	res.end(JSON.stringify(response));
});

// Get Mining Job Endpoint
// This endpoint will prepare a block candidate and the miner will calculate the nonce for it.
app.get('/mining/get-mining-job/:minerAddress', (req, res) => {
	let minerAddress = req.params.minerAddress;
	let response = node.getMiningJob(minerAddress);
	res.end(JSON.stringify(response));
});

// Submit Block Endpoint
// With this endpoint you will submit a mined block.
app.post('/mining/submit-mined-block', (req, res) => {
	let response = node.submitMinedBlock(req.body);
	res.end(JSON.stringify(response));
});

// Debug: Mine a Block Endpoint
// With this endpoint you can mine with the difficulty that you want. Use it only for debugging purposes.
app.get('/debug/mine/:minerAddress/:difficulty', (req, res) => {
	let minerAddress = req.params.minerAddress;
	let difficulty = req.params.difficulty;
	let response = node.debugMineBlock(minerAddress, difficulty);
	res.end(JSON.stringify(response));
});

// List All Peers Endpoint
// This endpoint will return all the peers of the node.
app.get('/peers', (req, res) => {
	let response = node.listAllPeers();
	res.end(JSON.stringify(response));
});

// Connect a Peer Endpoint
// With this endpoint, you can manually connect to other nodes.
app.post('/peers/connect', (req, res) => {
	let response = node.connectToPeer(req.body);
	res.end(JSON.stringify(response));
});

// Notify Peers about New Block Endpoint
// This endpoint will notify the peers about a new block.
app.post('/peers/notify-new-block', (req, res) => {
	let response = node.notifyPeersAboutNewBlock(req.body);
	res.end(JSON.stringify(response));
});

var listeningPort = 5555;

// The "commander" Node.js library was used to easily handle command-line arguments.
var commander = require('commander');
commander
	.usage('[OPTIONS]...')
	.option('-lp, --listeningPort <Port Number>', 'Listening Port Number', listeningPort)
	.parse(process.argv);

if (isNumeric(commander.listeningPort)) {
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

   node = new Node();

   console.log("Node Server listening at http://%s:%s", host, port);
});