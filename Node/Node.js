// Need below to do Hash Functionality functions
var CryptoJS = require('crypto-js');

// Need below to instantiate and get a handle on the Blockchain object.
var Blockchain = require('./Blockchain');

var GeneralUtilities = require('./GeneralUtilities');

// Research code for finding out how to generate the Node Id may be found in the "research/NodeIdTest.js" file.
// Identifier of the node (hash of Datetime + some random): Will interpret this as meaning to to be:
//    HASH(Datetime + some random number)
// Will use the SHA-512 Hash from the "crypto-js" Node.js library documented in the https://cryptojs.gitbook.io/docs
//    web page.
//
function generateNodeId() {
	// For the Datetime, will use the "new Date().toISOString()" as explained in the
	// https://www.geeksforgeeks.org/javascript-date-toisostring-function web page.
	let dateTime = new Date();
	let dateTimeString = dateTime.toISOString();

	// Will generate random Number using the Math.random() with Math.floor() as documented in the
	// https://www.w3schools.com/js/js_random.asp web page.
	let randomNumberString = Math.floor(Math.random() * 99999999999999999).toString();

	let concatenatedString = dateTimeString + randomNumberString;
	// console.log('concatenatedString =', concatenatedString);

	// let nodeId = CryptoJS.SHA512(concatenatedString); // 128 Hex Digits
	let nodeId = CryptoJS.RIPEMD160(concatenatedString); // 40 Hex Digits
	// console.log('nodeId =', nodeId);
	let nodeIdString = nodeId.toString();
	// console.log('nodeIdString = ', nodeIdString);

	return nodeIdString;
}

module.exports = class Node {

	// Reference: Node/research/REST-Endpoints_Info.jpg file
	constructor(hostNameOrId, listeningPort) {

		this.nodeId = generateNodeId(); // NodeId : unique_string
		// console.log('this.nodeId =', this.nodeId);

		this.selfUrl = `http://${hostNameOrId}:${listeningPort}`; // SelfUrl : URL
		// console.log('this.selfUrl =', this.selfUrl);

		// Idea obtained from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map web page.
		this.peers = new Map(); // Peers: map(nodeId --> URL)
		// this.peers.set("key1", "value1");
		// this.peers.set("key2", "value2");
		// console.log('this.peers =', this.peers);
		// console.log('this.peers.size =', this.peers.size);

		this.chain = new Blockchain(); // Chain: Blockchain

		// REST Endpoints: These are located in the "NodeServer.js" file where each such RESTFul Web Service will call
		//   the appropriate Node function that is shown below.

		// No specification on what the Name of the Node should be, so I decided to come up with a way to get a unique name
		// for each node for my "FranklinBlockchain".
		this.name = "FranklinBlockchain_" + hostNameOrId + "_" + listeningPort; // the "about" for the "/info" RESTFul Web Service
		// console.log('Node Name = ', this.name);

		// Reference: Node/research/REST-Endpoints_Info.jpg file
		// chainId == the hash of the genesis block (identifies the chain)
		this.chainId = this.chain.blocks[0].blockHash;
	}

	// General information
	// Endpoint for receiving general information about the node.
	// RESTFul URL --> /info
	//
	// Reference: Node/research/REST-Endpoints_Info.jpg file
	getGeneralInformation() {
		let response = {
			"about": this.name,
			"nodeId": this.nodeId,
			"chainId": this.chainId,
			"nodeUrl": this.selfUrl,
			"peers": this.peers.size,
			"currentDifficulty": this.chain.currentDifficulty,
			"blocksCount": this.chain.blocks.length,
			"cumulativeDifficulty": this.chain.calculateCumulativeDifficulty(),
			"confirmedTransactions": this.chain.calculateNumberOfConfirmedTransactions(),
			"pendingTransactions": this.chain.pendingTransactions.length
		};

		return response;
	}

	// Debug endpoint
	// This endpoint will print everything about the node. The blocks, peers, chain, pending transactions and much more.
	// RESTFul URL --> /debug
	//
	// References:
	// 1)The "Debug endpoint" Section of the Node/research/4_practical-project-rest-api.pdf file
	// 2)Node/research/REST-Endpoints_Debug-Info_All-Node-Data.jpg file
	//
	// There seems to be a difference in information displayed between the https://stormy-everglades-34766.herokuapp.com/debug URL
	// and what's in the References documentation. It appears that the https://stormy-everglades-34766.herokuapp.com/debug URL output
	// has more than what's in the documentation.
	// So, UNLESS the instructor states otherwise, what I'll do as far as the implementation of the /debug RESTFul Web Service is
	// implement as what's shown in the References documentation.
	getDebugInformation() {
		// Debug code below
		// this.peers.set("peer_node_1", "http://localhost:5556");
		// this.peers.set("peer_node_2", "http://localhost:5557");

		let response = {
			"selfUrl": this.selfUrl,
			"peers": GeneralUtilities.strMapToObj(this.peers),
			"chain": this.chain.getAsJsonObject(),

			// confirmedBalances – The balances of everyone: From what I interpret, this would be to get the balances of
			// ALL the Public Addresses based on the confirmed Transactions.
			"confirmedBalances": GeneralUtilities.strMapToObj(this.chain.getBalancesOfAllAddressesFromConfirmedTransactions())
		};

		return response;
	}

	// Reset the chain Endpoint
	// This endpoint will reset the chain and start it from the beginning; this is used only for debugging.
	// RESTFul URL --> /debug/reset-chain
	resetChain() {
		this.chain = new Blockchain();

		let response = {
			"message ": "The chain was reset to its genesis block"
		};

		return response;
	}

	// All blocks Endpoint
	// The endpoint will print all the blocks in the node’s chain.
	// RESTFul URL --> /blocks
	//
	// References:
	// 1) Node/research/REST-Endpoints_All-Blocks.jpg file
	// 2) Section "All blocks Endpoint" of the Node/research/4_practical-project-rest-api.pdf file
	getBlocksInformation() {
		let response = this.chain.blocks;
		return response;
	}

	// Block by Index Endpoint
	// The endpoint will print the block with the index that you specify
	// RESTFul URL --> /blocks/:index
	getBlockInformation(blockIndex) {
		let response = null;

		if (!GeneralUtilities.isNumeric(blockIndex)) {
			response = { errorMsg: "Block Index value is not positive numeric value" };
		}
		else if (blockIndex >= this.chain.blocks.length) {
			response = { errorMsg: "Invalid Block Index value - exceeds range of Blocks" }
		}
		else {
			response = this.chain.blocks[blockIndex];
		}

		return response;
	}

	// Get Pending Transactions Endpoint
	// This endpoint will print the list with transactions that have not been mined.
	// RESTFul URL --> /transactions/pending
	//
	// References:
	// 1) Node/research/REST-Endpoints_Get-Pending-Transactions.jpg file
	// 2) Section "Get Pending Transactions Endpoint" of the Node/research/4_practical-project-rest-api.pdf file
	//
	// Both of the above references have in their graphs NO "minedInBlock" nor "transferSuccessful" attribute in
	// the response DESPITE the item (2) reference having in it's written description that the output should have
	// BOTH "minedInBlock" and "transferSuccessful" attributes; so, we have some contradictory requirements, and I
	// will have to make a judgment call. In my view, since the Transaction is Pending and has NOT been Mined, the
	// "minedInBlock" and "transferSuccessful" attributes should NOT be present in the output.
	getPendingTransactions() {
		// Test code below: Should be commented out.
		// this.chain.pendingTransactions.push(this.chain.blocks[0].transactions[0]);

		let pendingTransactions = this.chain.pendingTransactions;

		let response = [];
		for (let i = 0; i < pendingTransactions.length; i++) {
			let pendingTransaction = pendingTransactions[i];
			let pendingTransactionOutput = {
				from: pendingTransaction.from,
				to: pendingTransaction.to,
				value: pendingTransaction.value,
				fee: pendingTransaction.fee,
				dateCreated: pendingTransaction.dateCreated,
				senderPubKey: pendingTransaction.senderPubKey,
				transactionDataHash: pendingTransaction.transactionDataHash,
				senderSignature: pendingTransaction.senderSignature
			}

			response.push(pendingTransactionOutput);
		}

		return response;
	}

	// Get Confirmed Transactions
	// This endpoint will print the list of the transactions that are included in blocks.
	// RESTFul URL --> /transactions/confirmed
	//
	// References:
	// 1) Node/research/REST-Endpoints_Get-Confirmed-Transactions.jpg file
	// 2) Section "Get Confirmed Transactions" of the Node/research/4_practical-project-rest-api.pdf file
	getConfirmedTransactions() {
		let response = this.chain.getConfirmedTransactions();
		return response;
	}

	// Get Transaction by Hash Endpoint
	// This endpoint will return a transaction identified by hash
	getTransactionGivenTransactionHashId(transactionHashId) {
		let response = {
				message: `The /transactions/${transactionHashId} RESTFul URL has been called!`
		};

		return response;
	}

	// List Transactions for Address
	// This endpoint will print all transactions for an address in which the address may be either the "from" or "to"
	// address in the transaction.
	listTransactionsForAddress(publicAddress) {
		let response = {
				message: `The /address/${publicAddress}/transactions RESTFul URL has been called!`
		};

		return response;
	}

	// Get Balance for Address Endpoint
	// This endpoint will return the balance of a specified address in the network.
	//
	// Balances Invalid for Address
	// If the address is valid but it is not used, return zero for the balance; if it is an invalid address, return an error message.
	getBalanceForAddress(publicAddress) {
		let response = {
				message: `The /address/${publicAddress}/balance RESTFul URL has been called!`
		};

		return response;
	}

	// Send Transaction
	// With this endpoint, you can broadcast a transaction to the network.
	sendTransaction(jsonInput) {
		let response = {
				message: `POST --> The /transactions/send RESTFul URL has been called!`,
				inputBody: jsonInput
		};

		return response;
	}

	// Get Mining Job Endpoint
	// This endpoint will prepare a block candidate and the miner will calculate the nonce for it.
	getMiningJob(minerAddress) {
		let response = {
				message: `The /mining/get-mining-job/${minerAddress} RESTFul URL has been called!`
		};

		return response;
	}

	// Submit Block Endpoint
	// With this endpoint you will submit a mined block.
	submitMinedBlock(jsonInput) {
		let response = {
				message: `POST --> The /mining/submit-mined-block RESTFul URL has been called!`,
				inputBody: jsonInput
		};

		return response;
	}

	// Debug: Mine a Block Endpoint
	// With this endpoint you can mine with the difficulty that you want. Use it only for debugging purposes.
	debugMineBlock(minerAddress, difficulty) {
		let response = {
				message: `The /debug/mine/${minerAddress}/${difficulty} RESTFul URL has been called!`
		};

		return response;
	}

	// List All Peers Endpoint
	// This endpoint will return all the peers of the node.
	listAllPeers() {
		let response = {
				message: "The /peers RESTFul URL has been called!"
		};

		return response;
	}

	// Connect a Peer Endpoint
	// With this endpoint, you can manually connect to other nodes.
	connectToPeer(jsonInput) {
		let response = {
				message: `POST --> The /peers/connect RESTFul URL has been called!`,
				inputBody: jsonInput
		};

		return response;
	}

	// Notify Peers about New Block Endpoint
	// This endpoint will notify the peers about a new block.
	notifyPeersAboutNewBlock(jsonInput) {
		let response = {
				message: `POST --> The /peers/notify-new-block RESTFul URL has been called!`,
				inputBody: jsonInput
		};

		return response;
	}
};