// Need below to do Hash Functionality functions
var CryptoJS = require('crypto-js');

// Need below to instantiate and get a handle on the Blockchain object.
var Blockchain = require('./Blockchain');

var GeneralUtilities = require('./GeneralUtilities');
var CryptoUtilities = require('./CryptoUtilities');
var Transaction = require('./Transaction');
var Block = require('./Block');
var GenesisBlock = require('./GenesisBlock');

// The "axios" Node.js library is used to make RESTFul Web Service calls from JavaScript.
// Sources where I found:
// 1) https://www.twilio.com/blog/2017/08/http-requests-in-node-js.html
// 2) https://github.com/axios/axios
var axios = require('axios');

// As per Patrick Galloway:
// 1) If there is an error in communications, or if the peer takes longer than 60 seconds to respond, the peer should be dropped.
// 2) If I call a peer with ANY RESTFul Web Service and I get back an error or there's no response in 60 seconds, I will drop the peer.
//
// References:
// 1) Node/research/Patrick-Galloway_What-to-do-if-Peer-does=not-respond-or-errors-out.jpg file
// 2) https://medium.com/@masnun/handling-timeout-in-axios-479269d83c68
var restfulCallTimeout = 60000; // 60 seconds or 60000 milliseconds

// Error Types to use in Output Messages
var confictErrorType = "Conflict";
var badRequestErrorType = "Bad Request";

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
		else
		{
			blockIndex = parseInt(blockIndex);
			if (blockIndex >= this.chain.blocks.length) {
				response = { errorMsg: "Invalid Block Index value - exceeds range of Blocks" }
			}
			else {
				response = this.chain.blocks[blockIndex];
			}
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
				data: pendingTransaction.data,
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
	// RESTFul URL --> /transactions/:hash
	//
	// References:
	// 1) Node/research/REST-Endpoints_Get-Transaction-by-Hash.jpg file
	// 2) Section "Get Transaction by Hash Endpoint" of the Node/research/4_practical-project-rest-api.pdf file
	//
	// Not clear from above references whether instructor meant to include BOTH confirmed and pending transactions or ONLY the
	// confirmed transactions. So, I'll make a judgment call and assume the instructor meant to take into account BOTH confirmed
	// and pending transactions.
	getTransactionGivenTransactionHashId(transactionHashId) {
		// Debug code below. Comment out.
		/*
		this.chain.pendingTransactions.push({
		 	"from": "1234567890abcdef1234567890abcdef12345678",
			"to": "123456761a500b8f3fb10eb29a55f24941f7444d",
			"value": 1000000000000,
			"fee": 0,
			"dateCreated": "2019-11-01T18:51:24.965Z",
			"data": "genesis tx",
			"senderPubKey": "00000000000000000000000000000000000000000000000000000000000000000",
			"transactionDataHash": "123456789012345bd456790be94a0b56557a4f3ec6b05f06a19e74e73368c82b",
			"senderSignature": [
			    "0000000000000000000000000000000000000000000000000000000000000000",
			    "0000000000000000000000000000000000000000000000000000000000000000"
			],
			"minedInBlockIndex": null,
    		"transferSuccessful": false
		});
		*/

		let transactionsToSearch = this.chain.getAllTransactions();
		let theChosenTransaction = undefined;

		for (let i = 0; i < transactionsToSearch.length; i++) {
			let transaction = transactionsToSearch[i];
			if (transaction.transactionDataHash === transactionHashId) {
				theChosenTransaction = transaction;
				break;
			}
		}

		let response = null;
		if (theChosenTransaction === undefined) {
			response = {
				errorMsg: "No such Transaction was found having the given Transaction Hash Id"
			}
		}
		else {
			response = theChosenTransaction;
		}

		return response;
	}

	// List All Account Balance
	// This endpoint will return all the balances in the network.
	// RESTFul URL --> /balances
	//
	// References:
	// 1) Node/research/REST-Endpoints_List-All-Account-Balances.jpg file
	// 2) Section "List All Account Balance" of the Node/research/4_practical-project-rest-api.pdf file
	//
	// From the above references, I conclude that these would be balances based on Confirmed Transactions.
	//
	// There appears to be a difference between the above two references as to whether we should display accounts
	// with ZERO balances. Reference (1) states only non-ZERO balances, while reference (2) shows in it's sample
	// output an account with a ZERO balance. Therefore, I will go ahead and ALSO display accounts that have ZERO
	// balances.
	listAllAccountBalances() {
		let responseMap = this.chain.getBalancesOfAllAddressesFromConfirmedTransactions();
		let response = GeneralUtilities.strMapToObj(responseMap);

		return response;
	}

	// List Transactions for Address
	// This endpoint will print all transactions for an address in which the address may be either the "from" or "to"
	// address in the transaction.
	//
	// References:
	// 1) Node/research/REST-Endpoints_List-Transactions-for-Address.jpg file
	// 2) Section "List Transactions for Address" of the Node/research/4_practical-project-rest-api.pdf file
	//
	// Several judgement calls that needed to be made as explained below:
    // 1) On the Reference (1) above, it states that "Pending transactions will not have a minedInBlock".
    //    So, does the professor want us to show this attribute in the output if it's a Pending Transaction? What I've
    //    done for Pending Transactions is that the "minedInBlock" attribute is set to a "null" value and for such transactions,
    //    the "minedInBlock" will show up with a "null" value.
    //    So, UNLESS the professor states otherwise, I will still show the "minedInBlock" for ALL Transactions, but the
    //    Pending Transactions will have their "minedInBlock" show up with a "null" value.
    // 2) On the Reference (1) shown above, it states that an HTTP Status of "404 Not Found" is one of the possible
    //    HTTP Statuses that may be returned, but it does not state under what circumstances such a status should be returned.
    //    I will have to now make a judgement call.
    //    You could have a situation where you feed in a Public Address, and it has no Transactions; that is a legitimate situation,
    //    and in my view an HTTP Status of "200 OK" should still be returned with a "transactions" of "[ ]" showing up.
    //    Therefore, UNLESS the professor states otherwise... I'm going to have to make a judgment call on this. I'll
    //    return back an HTTP Status of "404 Not Found" if the Public Address fed into the RESTFul URL is not a valid Public Address.
    // 3) From the above TWO seperate (1) and (2) References, there appears to be a difference in output where one states to have
    //    a "address" and "transactions" attributes and the other just shows an array list of transactions.
    //    So, it's not clear WHAT the professor wants here, so, I'm going to have to make a judgement call on this. UNLESS the
    //    professor state otherwise, I will go ahead and make the output have "address" and "transactions" attributes.
	listTransactionsForAddress(publicAddress) {
		// Debug code below. Comment out.
		/*
		this.chain.pendingTransactions.push({
		 	"from": "fce3a061a500b8f3fb10eb29a55f24941f7444de",
			"to": "1234567890abcdef1234567890abcdef12345678",
			"value": 5000,
			"fee": 10,
			"dateCreated": "2019-11-02T18:51:24.965Z", // after genesis block
			"data": "genesis tx",
			"senderPubKey": "00000000000000000000000000000000000000000000000000000000000000000",
			"transactionDataHash": "123456789012345bd456790be94a0b56557a4f3ec6b05f06a19e74e73368c82b",
			"senderSignature": [
			    "0000000000000000000000000000000000000000000000000000000000000000",
			    "0000000000000000000000000000000000000000000000000000000000000000"
			],
			"minedInBlockIndex": null,
    		"transferSuccessful": false
		});
		this.chain.pendingTransactions.push({
			"from": "fce3a061a500b8f3fb10eb29a55f24941f7444de",
			"to": "1234567890abcdef1234567890abcdef12345678",
			"value": 8000,
			"fee": 20,
			"dateCreated": "2019-10-02T18:51:24.965Z", // before geneis block
			"data": "genesis tx",
			"senderPubKey": "00000000000000000000000000000000000000000000000000000000000000000",
			"transactionDataHash": "123456789012345bd456790be94a0b56557a4f3ec6b05f06a19e74e73368c82b",
			"senderSignature": [
				"0000000000000000000000000000000000000000000000000000000000000000",
				"0000000000000000000000000000000000000000000000000000000000000000"
			],
			"minedInBlockIndex": null,
		    "transferSuccessful": false
		});
		*/

		let response = null;

		// Reference for sorting a JavaScript Array:
		// 1) https://www.w3schools.com/jsref/jsref_sort.asp
		// 2) https://alligator.io/js/array-sort-numbers
		//
		// References for ISO Data String and comparison:
		// 1) https://flaviocopes.com/javascript-dates
		// 2) https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
		if (GeneralUtilities.isValidPublicAddress(publicAddress)) {
			let transactionsForAddress = this.chain.getAllTransactionsFromPublicAddress(publicAddress);
			let sortedAscendingDateCreatedOrderTransactionsForAddress =
					transactionsForAddress.sort((firstTransaction, secondTransaction) => {
						let firstDateCreated = new Date(firstTransaction.dateCreated);
						let secondDateCreated = new Date(secondTransaction.dateCreated);
						return (firstDateCreated.getTime() - secondDateCreated.getTime());
					});

			response = {
				address: publicAddress,
				transactions: sortedAscendingDateCreatedOrderTransactionsForAddress
			};
		}
		else {
			response = {
				errorMsg: "Invalid address"
			};
		}

		return response;
	}

	// Get Balance for Address Endpoint
	// This endpoint will return the balance of a specified address in the network.
	//
	// Balances Invalid for Address
	// If the address is valid but it is not used, return zero for the balance; if it is an invalid address, return an error message.
	//
	// RESTFul URL --> /address/:publicAddress/balance
	//
	// References:
	// 1) Node/research/REST-Endpoints_Get-Balances-for-Address.jpg file
	// 2) Node/research/Balances-for-Address.jpg file
	// 3) Node/research/REST-Endpoints_Balances-Invalid-for-Address.jpg file
	// 4) Section "Get Balance for Address Endpoint" of the Node/research/4_practical-project-rest-api.pdf file
	// 5) Section "Balances Invalid for Address" of the Node/research/4_practical-project-rest-api.pdf file
	//
	// From the above References I conclude the below:
	// 1) Once a Transaction has been placed into the "this.chain.blocks" array of Block, that Transaction automatically has ONE
	//    confirmation.
	// 2) The number of Confirmations for a Transaction would be the number of blocks in the
	//    Blockchain minus the Index Number of the Block that the Transaction got mined. What
	//    this means is that once a Transaction gets placed into a Block, that starts off the
	//    Confirmation Count of 1 for the Transaction. The starting Index Block Number for the
	//    Blocks is Index 0 (i.e., zero).
	//    So, once a Transaction gets placed in one of the blocks in the "this.chain.blocks" Block array
	//    that counts as the FIRST confirmation.
	// 3) The "pendingBalance" includes the balances pertaining to the following:
	//    a) Transactions that are in the Pending State (i.e., it's "minedInBlockIndex" has a null value)
	//    b) Transactions that are in the "this.chain.blocks" Block array and whose "transferSuccessful" flag is
	//       boolean true.
	getBalanceForAddress(publicAddress) {
		// Debug code below. Comment out.
		/*
		this.chain.pendingTransactions.push({
		 	"from": "fce3a061a500b8f3fb10eb29a55f24941f7444de",
			"to": "1234567890abcdef1234567890abcdef12345678",
			"value": 5000000,
			"fee": 100,
			"dateCreated": "2019-11-02T18:51:24.965Z", // after genesis block
			"data": "genesis tx",
			"senderPubKey": "00000000000000000000000000000000000000000000000000000000000000000",
			"transactionDataHash": "123456789012345bd456790be94a0b56557a4f3ec6b05f06a19e74e73368c82b",
			"senderSignature": [
			    "0000000000000000000000000000000000000000000000000000000000000000",
			    "0000000000000000000000000000000000000000000000000000000000000000"
			],
			"minedInBlockIndex": null,
    		"transferSuccessful": false
		});
		*/

		let response = null;

		if (typeof publicAddress === 'string') {
			publicAddress = publicAddress.trim();
			publicAddress = publicAddress.toLowerCase();
		}

		if (GeneralUtilities.isValidPublicAddress(publicAddress)) {
			let transactionsForAddress = this.chain.getAllTransactionsFromPublicAddress(publicAddress);

			let safeBalanceValue = 0;
			let confirmedBalanceValue = 0;
			let pendingBalanceValue = 0;

			let safeConfirmCount = 6;

			// Debug Code Below. Comment Out.
			/*
			this.chain.blocks.push({});
			this.chain.blocks.push({});
			this.chain.blocks.push({});
			this.chain.blocks.push({});
			this.chain.blocks.push({});
			console.log('this.chain.blocks.length =', this.chain.blocks.length);
			*/

			for (let i = 0; i < transactionsForAddress.length; i++) {
				let transaction = transactionsForAddress[i];

				let deltaBalanceValue = 0;
				if (transaction.to === publicAddress) {
					deltaBalanceValue += transaction.value;
				}
				else if (transaction.from === publicAddress) {
					deltaBalanceValue -= transaction.fee;
					deltaBalanceValue -= transaction.value;
				}

				// console.log('deltaBalanceValue =', deltaBalanceValue);

				// If this is a Pending Transaction, then...
				if (transaction.minedInBlockIndex === null) {

					// pendingBalance - expected balance (0 confirmations)
					// It is assumed that all pending transactions will be successful
					pendingBalanceValue += deltaBalanceValue;
				}
				else // This is a Transaction that has been confirmed at least once..
				{
					// The number of Confirmations for a Transaction would be the number of blocks in the
					// Blockchain minus the Index Number of the Block that the Transaction got mined. What
					// this means is that once a Transaction gets placed into a Block, that starts off the
					// Confirmation Count of 1 for the Transaction. The starting Index Block Number for the
					// Blocks is Index 0 (i.e., zero).
					//
					// So, once a Transaction gets placed in one of the blocks in the "this.chain.blocks" Block array
					// that counts as the FIRST confirmation.
					let numberOfConfirmations = this.chain.blocks.length - transaction.minedInBlockIndex;
					// console.log('numberOfConfirmations =', numberOfConfirmations);

					if (transaction.transferSuccessful) {
						confirmedBalanceValue += deltaBalanceValue;

						// pendingBalance - expected balance (0 confirmations)
						// It is assumed that all pending transactions will be successful
						// I interpret "expected Balance" to mean that we ALSO count in the Transactions that have
						//    been confirmed, since the expected balance should include Transactions that have been
						//    placed in the actual "this.chain.blocks" - and thus automatically have ONE confirmation - PLUS
						//    the transactions that are Pending and are expected to become successful.
						pendingBalanceValue += deltaBalanceValue;

						if (numberOfConfirmations >= safeConfirmCount) {
							safeBalanceValue += deltaBalanceValue;
						}
					}
				} // end if (transaction.minedInBlockIndex === null)
			} // end for loop

			response = {
				safeBalance: safeBalanceValue,
				confirmedBalance: confirmedBalanceValue,
				pendingBalance: pendingBalanceValue
			}
		}
		else {
			response = {
				errorMsg: "Invalid address"
			};
		}

		return response;
	}

	// Send Transaction
	// With this endpoint, you can broadcast a transaction to the network.
	// RESTFul URL --> /transactions/send
	//
	// Receives a Transaction, validates it, put's it in the pendingTransaction List.
	// For a description of what this method does, see the Node/research/Send-Transactions.jpg file.
	//
	// References:
	// 1) Node/research/REST-Endpoints_Send-Transaction.jpg file
	// 2) Node/research/Send-Transactions.jpg file
	// 3) Node/research/REST-Endpoints_Send-Transaction_Error.jpg file
	// 4) Section "Send Transaction" of the Node/research/4_practical-project-rest-api.pdf file
	sendTransaction(jsonInput) {
		// Check that all the expected fields in the jsonInput are present.
		if (!jsonInput.hasOwnProperty("from")) {
			return { errorMsg: "Invalid transaction: field 'from' is missing" };
		}
		if (!jsonInput.hasOwnProperty("to")) {
			return { errorMsg: "Invalid transaction: field 'to' is missing" };
		}
		if (!jsonInput.hasOwnProperty("value")) {
			return { errorMsg: "Invalid transaction: field 'value' is missing" };
		}
		if (!jsonInput.hasOwnProperty("fee")) {
			return { errorMsg: "Invalid transaction: field 'fee' is missing" };
		}
		if (!jsonInput.hasOwnProperty("dateCreated")) {
					return { errorMsg: "Invalid transaction: field 'dateCreated' is missing" };
		}
		if (!jsonInput.hasOwnProperty("data")) {
			return { errorMsg: "Invalid transaction: field 'data' is missing" };
		}
		if (!jsonInput.hasOwnProperty("senderPubKey")) {
			return { errorMsg: "Invalid transaction: field 'senderPubKey' is missing" };
		}
		if (!jsonInput.hasOwnProperty("senderSignature")) {
			return { errorMsg: "Invalid transaction: field 'senderSignature' is missing" };
		}

		// Check that all the expected fields are of the correct type.
		if (typeof jsonInput.from !== 'string') {
			return { errorMsg: "Invalid transaction: field 'from' is not a string - it should be a 40-Hex string" };
		}
		if (typeof jsonInput.to !== 'string') {
			return { errorMsg: "Invalid transaction: field 'to' is not a string - it should be a 40-Hex string" };
		}
		if (!Number.isInteger(jsonInput.value)) {
			return { errorMsg: "Invalid transaction: field 'value' is not an integer - it should be an integer greater than or equal to 0" };
		}
		if (!Number.isInteger(jsonInput.fee)) {
			return { errorMsg: "Invalid transaction: field 'fee' is not an integer - it should be an integer greater than or equal to 10" };
		}
		if (typeof jsonInput.dateCreated !== 'string') {
			return { errorMsg: "Invalid transaction: field 'dateCreated' is not a string - it should be an ISO8601 date string as follows: YYYY-MM-DDTHH:MN:SS.MSSZ" };
		}
		if (typeof jsonInput.data !== 'string') {
			return { errorMsg: "Invalid transaction: field 'data' is not a string - it should be a string" };
		}
		if (typeof jsonInput.senderPubKey !== 'string') {
			return { errorMsg: "Invalid transaction: field 'senderPubKey' is not a string - it should be a 65-Hex string" };
		}
		if (!Array.isArray(jsonInput.senderSignature)) {
			return { errorMsg: "Invalid transaction: field 'senderSignature' is not an array - it should be a 2-element array of [64-hex string][64-hex string]" };
		}

		// Check that the "senderSignature" is a two-element array.
		if (jsonInput.senderSignature.length !== 2) {
			return { errorMsg: "Invalid transaction: array field 'senderSignature' does not have 2 elements - it should be a 2-element array of [64-hex string][64-hex string]" };
		}

		// Check that the first and second elements of the "senderSignature" array are each strings
		if (typeof jsonInput.senderSignature[0] !== 'string') {
			return { errorMsg: "Invalid transaction: first element of array field 'senderSignature' is not a string - it should be a 64-hex string" };
		}
		if (typeof jsonInput.senderSignature[1] !== 'string') {
			return { errorMsg: "Invalid transaction: second element of array field 'senderSignature' is not a string - it should be a 64-hex string" };
		}

		// Trim the fields that are of type string to remove any white space at the beginning and the end.
		jsonInput.from = jsonInput.from.trim();
		jsonInput.to = jsonInput.to.trim();
		jsonInput.dateCreated = jsonInput.dateCreated.trim();
		jsonInput.data = jsonInput.data.trim();
		jsonInput.senderPubKey = jsonInput.senderPubKey.trim();
		jsonInput.senderSignature[0] = jsonInput.senderSignature[0].trim();
		jsonInput.senderSignature[1] = jsonInput.senderSignature[1].trim();

		// For the Hex-valued strings, go ahead convert the strings to lower case.
		jsonInput.from = jsonInput.from.toLowerCase();
		jsonInput.to = jsonInput.to.toLowerCase();
		jsonInput.senderPubKey = jsonInput.senderPubKey.toLowerCase();
		jsonInput.senderSignature[0] = jsonInput.senderSignature[0].toLowerCase();
		jsonInput.senderSignature[1] = jsonInput.senderSignature[1].toLowerCase();

		// Check that the "to" and "from" fields have valid Public Address string values.
		if (!GeneralUtilities.isValidPublicAddress(jsonInput.from)) {
			return { errorMsg: "Invalid transaction: string field 'from' is not a 40-Hex string - it should be a 40-Hex string" };
		}
		if (!GeneralUtilities.isValidPublicAddress(jsonInput.to)) {
			return { errorMsg: "Invalid transaction: string field 'to' is not a 40-Hex string - it should be a 40-Hex string" };
		}

		// Check that the number "value" field has a value that is greater than or equal to zero.
		if (jsonInput.value < 0) {
			return { errorMsg: "Invalid transaction: number field 'value' is less than 0 - it should be a number greater than or equal to 0" };
		}

		// Check that the number "fee" field has a value that is greater than or equal to 10.
		if (jsonInput.fee < 10) {
			return { errorMsg: "Invalid transaction: number field 'fee' is less than 10 - it should be a number greater than or equal to 10" };
		}

		// Check that the "dateCreated" field is a valid ISO8601 date string.
		if (!GeneralUtilities.isValid_ISO_8601_date(jsonInput.dateCreated)) {
			return { errorMsg: "Invalid transaction: field 'dateCreated' is not an ISO8601 date string - it should be an ISO8601 date string as follows: YYYY-MM-DDTHH:MN:SS.MSSZ" };
		}

		// Check that the "dateCreated" field's datetime is less than or equal to the current datetime.
		let currentDateTime = new Date();
		let dateCreated_DateTime = new Date(jsonInput.dateCreated);
		if (dateCreated_DateTime.getTime() > currentDateTime.getTime()) {
			return { errorMsg: "Invalid transaction: field 'dateCreated' has a time value that is in the future - it's time value should be less than or equal to the current time" };
		}

		// Check that the "senderPubKey" field is a valid Public Key string value.
		if (!GeneralUtilities.isValidPublicKey(jsonInput.senderPubKey)) {
			return { errorMsg: "Invalid transaction: field 'senderPubKey' is not a 65-Hex string - it should be a 65-Hex string" };
		}

		// Check that the first and second elements of the "senderSignature" array are each 64-Hex string
		if (!GeneralUtilities.isValidSignatureElement(jsonInput.senderSignature[0])) {
			return { errorMsg: "Invalid transaction: first element of array field 'senderSignature' is not a 64-hex string value - it should be a 64-hex string" };
		}
		if (!GeneralUtilities.isValidSignatureElement(jsonInput.senderSignature[1])) {
			return { errorMsg: "Invalid transaction: second element of array field 'senderSignature' is not a 64-hex string value - it should be a 64-hex string" };
		}

		// Validate the "senderPubKey": Make sure that the Public Address obtained from the "senderPubKey" matches the "to" Address.
		let calculatedSenderPublicAddress = CryptoUtilities.getPublicAddressFromPublicKey(jsonInput.senderPubKey);
		if (jsonInput.from !== calculatedSenderPublicAddress) {
			return { errorMsg: "Invalid transaction: field 'senderPubKey' does not match the 'from' public address when derving the public address from the public key" };
		}

		let newTransaction = new Transaction(
				jsonInput.from, // address (40 hex digits) string
				jsonInput.to, // address (40 hex digits) string
				jsonInput.value, // integer (non negative)
				jsonInput.fee, // integer (non negative)
				jsonInput.dateCreated, // ISO8601_string
				jsonInput.data, // string (optional)
				jsonInput.senderPubKey, // hex_number[65] string
		    	jsonInput.senderSignature); // hex_number[2][64] : 2-element array of (64 hex digit) strings


		// Check to see if another Transaction exists that has the given Transaction Data Hash.
		let transaction = this.getTransactionGivenTransactionHashId(newTransaction.transactionDataHash);
		if (!transaction.hasOwnProperty("errorMsg")) {
			return { errorMsg: `Duplicate transaction: Transaction already exists that has Transaction Data Hash -> ${newTransaction.transactionDataHash}` };
		}

		// Validate the "senderSignature" to make sure that the "from" Public Address signed the Transaction.
		let validSignature = CryptoUtilities.verifySignature(
				newTransaction.transactionDataHash,
				jsonInput.senderPubKey,
				{ r: jsonInput.senderSignature[0], s: jsonInput.senderSignature[1]} );
		if (!validSignature) {
			return { errorMsg: "Invalid transaction: Invalid signature in the 'senderSignature' field" };
		}

		// Check the sender account balance to be >= value + fee
		// Will assume that "account balance" of interest is the "confirmedBalance".
		let accountBalance = this.getBalanceForAddress(jsonInput.from);
		if (accountBalance.confirmedBalance < (jsonInput.value + jsonInput.fee)) {
			return { errorMsg: "Invalid transaction: not enough account balance in the 'from' address for the given 'value' and 'fee' amounts" };
		}

		// Put the "newTransaction" in the "pending transactions" pool
		this.chain.pendingTransactions.push(newTransaction);

		let response = { transactionDataHash: newTransaction.transactionDataHash };
		return response;
	}

	// Get Mining Job Endpoint
	// This endpoint will prepare a block candidate and the miner will calculate the nonce for it.
	// RESTFul URL --> /mining/get-mining-job/:minerAddress
	//
	// References:
	// 1) Node/research/The-Mining-Process_Preparation.jpg file
	// 2) Section "Get Mining Job Endpoint" of the Node/research/4_practical-project-rest-api.pdf file
	// 3) Node/research/Implementing-the-Mining_Get-Mining-Job.jpg file
	// 4) Node/research/The-Coinbase-Transaction_Reward.jpg file
	// 5) Node/research/Block-Candidate-JSON_Example.jpg file
	// 6) Node/research/Transactions-in-the-Block-Candidates.jpg file
	// 7) Node/research/Coins-and-Rewards.jpg file
	// 8) Node/research/The-Mining-Pool-in-the-Nodes.jpg file
	getMiningJob(minerAddress) {
		if (typeof minerAddress !== 'string') {
			return { errorMessage: "Invalid Miner Address: Miner Address is not a string - it should be a 40-Hex string" }
		}

		minerAddress = minerAddress.trim();
		minerAddress = minerAddress.toLowerCase();
		if (!GeneralUtilities.isValidPublicAddress(minerAddress)) {
			return { errorMessage: "Invalid Miner Address: Miner Address is not a 40-Hex string - it should be a 40-Hex string" }
		}

		// We need to take a snapshot full copy first of all the Pending Transactions, because we might have a situation of multiple
		// requests from different miners to request a block to mine and some of these pending transactions might be in different blocks
		// (i.e., mining jobs) to be mined.
		// Reference ---> https://dev.to/samanthaming/how-to-deep-clone-an-array-in-javascript-3cig
		let pendingTransactionsConsideredForNextBlock = JSON.parse(JSON.stringify(this.chain.pendingTransactions));

		// We want the transactions with the highest fees at the top of the list. So, we will sort these Transaction in descending order
		// from highest fee to lower fees.
		// Reference: Node/research/The-Mining-Process_Preparation.jpg file
		//
		// Source for Coding Technique --> https://www.w3schools.com/jsref/jsref_sort.asp
		pendingTransactionsConsideredForNextBlock.sort(function(a, b) { return b.fee - a.fee });

		// As we go through the "pendingTransactionsConsideredForNextBlock", there are some that may be placed in the next block and some that
		// are not. So, we keep track of this with the below Map where the key will be the 'from' address of the pending transaction. We do this
		// because we want to minimize a double spend problem by only allowing ONE Transation per 'from' address in the next block.
		let pendingTransactionsToBePlacedInNextBlockForMiningMap = new Map();

		// Get the Confirmed Balances for ALL of the Public Addresses. We'll need this as a starting point as we "executes all pending transactions
        // and adds them in the block candidate".
		// Reference: Node/research/The-Mining-Process_Preparation.jpg file
		let confirmedBalancesMap = this.chain.getBalancesOfAllAddressesFromConfirmedTransactions();

		// Will need in the upcoming "for" loop to place the "minedInBlock" value. Also, we want a snapshot here to avoid the possibility
		// that while executing a "for" loop some other process may have added a new Block. Block Indexes start at 0.
		let nextBlockIndex = this.chain.blocks.length;

		// We need to keep track of the Coinbase Transaction value, which will be the sum of the following:
		// 1) The Block Reward: 5,000,000 micro-coins
		// 2) Sum of all the Fees of the Transactions that will be placed in the Next Block to be Mined
		//
		// Reference: Node/research/Coins-and-Rewards.jpg file
		let coinbaseTransactionValue = 5000000;

		// Executes all pending transactions and adds them in the block candidate (i.e.,pendingTransactionsToBePlacedInNextBlockForMiningMap).
		for (let i = 0; i < pendingTransactionsConsideredForNextBlock.length; i++) {
			let pendingTransaction = pendingTransactionsConsideredForNextBlock[i];

			// If there's already a Transaction to be placed in the Next Block for mining that has the same "from" Public Addres, then just
			// skip this Transaction to avoid possible double-spend problem and move on to the next Transaction. This Transaction to be skipped
			// can be placed later on in another Block.
			if (pendingTransactionsToBePlacedInNextBlockForMiningMap.has(pendingTransaction.from)) {
				continue;
			}

			if (!confirmedBalancesMap.has(pendingTransaction.from)) {
				confirmedBalancesMap.set(pendingTransaction.from, 0);
			}

			if (!confirmedBalancesMap.has(pendingTransaction.to)) {
				confirmedBalancesMap.set(pendingTransaction.to, 0);
			}

			// Not clear from instructions on how to process here, but I think I heard in the live lecture that if a "from" Public Address
			// has enough to fund the Transaction Fee but NOT the Transaction Value, just go ahead and add the Transaction in the
			// next Block ONLY the "tranferSuccessful" is to be set to a boolean "false". But.. if the "from" Public Address does NOT have enough
			// to the Transaction Fee, then do NO NOT place this Pending Transaction in the Next Block to be Mined.
			//
			// We run and "execute" all these Transactions to make sure that they have the proper balances, but remember that they STILL
			// have not been confirmed, but we must act as if they have and will be mined.
			if (confirmedBalancesMap.get(pendingTransaction.from) >= pendingTransaction.fee) {

				pendingTransaction.minedInBlockIndex = nextBlockIndex;

				// The "from" address in a Transaction ALWAYS pays the fee.
				let tempBalance = confirmedBalancesMap.get(pendingTransaction.from);
				tempBalance -= pendingTransaction.fee;
			    confirmedBalancesMap.set(pendingTransaction.from, tempBalance);

			    // Add the "fee" to the Coinbase Transaction Value field.
			    coinbaseTransactionValue += pendingTransaction.fee;

				if (confirmedBalancesMap.get(pendingTransaction.from) >= (pendingTransaction.fee + pendingTransaction.value)) {
					// Debit appropriately the "from" Public Address
					tempBalance = confirmedBalancesMap.get(pendingTransaction.from);
					tempBalance -= pendingTransaction.value;
					confirmedBalancesMap.set(pendingTransaction.from, tempBalance);

					// Credit appropriately the "to" Public Address
					tempBalance = confirmedBalancesMap.get(pendingTransaction.to);
					tempBalance += pendingTransaction.value;
					confirmedBalancesMap.set(pendingTransaction.to, tempBalance);

					pendingTransaction.transferSuccessful = true;
				}
				else { // The "from" Address does not have enough to cover both the Transaction fee and value
					pendingTransaction.transferSuccessful = false;
				}

				// At this point, we know that the Pending Transaction can be placed in the Next Block to be Mined.
				pendingTransactionsToBePlacedInNextBlockForMiningMap.set(pendingTransaction.from, pendingTransaction);
			}
			else { // "from" Public Address does not have enough to cover the Fee

				// Not sure what the professor wants here, but if the Pending Transaction does not even have enough to cover BOTH the
				// Transaction Fee, then it's probably best to just remove it from the Blockchain Pending Transaction List.
				// Filter Technique Source --> https://alligator.io/js/filter-array-method
				this.chain.pendingTransactions = this.chain.pendingTransactions.filter(aTransaction =>
					aTransaction.transactionDataHash != pendingTransaction.transactionDataHash);
			}
		}

		// Create the Coinbase Transaction.
		// Reference: Node/research/The-Coinbase-Transaction_Reward.jpg file
		let coinbaseTransaction = new Transaction(
				GenesisBlock.allZeros_40_Hex_PublicAddress, // from: address (40 hex digits) string
				minerAddress, // to: address (40 hex digits) string
				coinbaseTransactionValue, // value: integer (non negative)
				0, // fee: integer (non negative)
				new Date().toISOString(), // ISO8601_string
				"coinbase tx", // data: string (optional)
				GenesisBlock.allZeros_65_Hex_String, // senderPubKey: hex_number[65] string

				// senderSignature: hex_number[2][64] : 2-element array of (64 hex digit) strings
				[GenesisBlock.allZeros_64_Hex_String, GenesisBlock.allZeros_64_Hex_String],

				nextBlockIndex, // minedInBlockIndex: integer / null
				true); // transferSuccessful: boolean

		// Create the list of Transactions to be placed in the Next Block to be mined.
		// The Coinbase Transaction is always the FIRST Transaction in the array of Transactions.
		//
		// References for coding technique:
		// 1) https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
		// 2) https://stackoverflow.com/questions/9650826/append-an-array-to-another-array-in-javascript
		let transactionsToBePlacedInNextBlockForMining = [ coinbaseTransaction ];
		transactionsToBePlacedInNextBlockForMining.push.apply(
			transactionsToBePlacedInNextBlockForMining,
			Array.from(pendingTransactionsToBePlacedInNextBlockForMiningMap.values()));

		// console.log('nextBlockIndex = ', nextBlockIndex);
		// console.log('this.chain.blocks =', this.chain.blocks);

		// Create the Block to be Mined.
		// Reference: Node/research/Block-Candidate-JSON_Example.jpg file
		let blockToBeMined = new Block(
			nextBlockIndex, // Index: integer (unsigned)
			transactionsToBePlacedInNextBlockForMining, // Transactions : Transaction[]
			this.chain.currentDifficulty, // Difficulty: integer (unsigned)
			this.chain.blocks[nextBlockIndex - 1].blockHash, // PrevBlockHash: hex_number[64] string
			minerAddress); // MinedBy: address (40 hex digits) string

		// Now place the "blockToBeMined" into the Blockchain "miningJobs"
		this.chain.miningJobs.set(blockToBeMined.blockDataHash, blockToBeMined);

		// console.log('blockToBeMined.transactions =', blockToBeMined.transactions);
		// console.log('this.chain.miningJobs =', this.chain.miningJobs);

		// References:
		// 1) Section "Get Mining Job Endpoint" of the Node/research/4_practical-project-rest-api.pdf file
	    // 2) Node/research/Implementing-the-Mining_Get-Mining-Job.jpg file
		let response = {
				'index': blockToBeMined.index,
				'transactionsIncluded': blockToBeMined.transactions.length,
				'difficulty': blockToBeMined.difficulty,
				'expectedReward': blockToBeMined.transactions[0].value,
				'rewardAddress': blockToBeMined.transactions[0].to,
				'blockDataHash': blockToBeMined.blockDataHash
		};

		return response;
	}

	// Submit Block Endpoint
	// With this endpoint you will submit a mined block.
	// RESTFul URL --> /mining/submit-mined-block
	//
	// References:
	// 1) Section "Submit Block Endpoint" of the Node/research/4_practical-project-rest-api.pdf file
	// 2) Node/research/Processing-a-Mined-Block.jpg file
	// 3) Node/research/Implementing-the-Mining_Submit-Block.jpg file
	// 4) Node/research/Implementing-the-Mining_Submit-Invalid-Block.jpg file
	// 5) Node/research/The-Mining-Pool-in-the-Nodes.jpg file
	// 6) Node/research/Network-Difficulty_Static-or-Dynamic.jpg file
	submitMinedBlock(jsonInput) {
		// Check that all the expected fields in the jsonInput are present.
		if (!jsonInput.hasOwnProperty("blockDataHash")) {
			return { errorMsg: "Bad Request: field 'blockDataHash' is missing" };
		}
		if (!jsonInput.hasOwnProperty("dateCreated")) {
			return { errorMsg: "Bad Request: field 'dateCreated' is missing" };
		}
		if (!jsonInput.hasOwnProperty("nonce")) {
			return { errorMsg: "Bad Request: field 'nonce' is missing" };
		}
		if (!jsonInput.hasOwnProperty("blockHash")) {
			return { errorMsg: "Bad Request: field 'blockHash' is missing" };
		}

		// Check that all the expected fields are of the correct type.
		if (typeof jsonInput.blockDataHash !== 'string') {
			return { errorMsg: "Bad Request: field 'blockDataHash' is not a string - it should be a 64-Hex string" };
		}
		if (typeof jsonInput.dateCreated !== 'string') {
			return { errorMsg: "Bad Request: field 'dateCreated' is not a string - it should be an ISO8601 date string as follows: YYYY-MM-DDTHH:MN:SS.MSSZ" };
		}
		if (!Number.isInteger(jsonInput.nonce)) {
			return { errorMsg: "Bad Request: field 'nonce' is not an integer - it should be an integer greater than or equal to 0" };
		}
		if (typeof jsonInput.blockHash !== 'string') {
			return { errorMsg: "Bad Request: field 'blockHash' is not a string - it should be a 64-Hex string" };
		}

		// Trim all the string field values.
		jsonInput.blockDataHash = jsonInput.blockDataHash.trim();
		jsonInput.dateCreated = jsonInput.dateCreated.trim();
		jsonInput.blockHash = jsonInput.blockHash.trim();

		// For the Hex-valued strings, go ahead and convert the strings to lower case.
		jsonInput.blockDataHash = jsonInput.blockDataHash.toLowerCase();
		jsonInput.blockHash = jsonInput.blockHash.toLowerCase();

		// Check that the "blockDataHash" and "blockHash" fields have 40-Hex string values.
		if (!GeneralUtilities.isValid_64_Hex_string(jsonInput.blockDataHash)) {
			return { errorMsg: "Bad Request: string field 'blockDataHash' is not a 64-Hex string - it should be a 64-Hex string" };
		}
		if (!GeneralUtilities.isValid_64_Hex_string(jsonInput.blockHash)) {
			return { errorMsg: "Bad Request: string field 'blockHash' is not a 64-Hex string - it should be a 64-Hex string" };
		}

		// Check that the "dateCreated" field is a valid ISO8601 date string.
		if (!GeneralUtilities.isValid_ISO_8601_date(jsonInput.dateCreated)) {
			return { errorMsg: "Bad Request: field 'dateCreated' is not an ISO8601 date string - it should be an ISO8601 date string as follows: YYYY-MM-DDTHH:MN:SS.MSSZ" };
		}

		// Check that the "dateCreated" field's datetime is less than or equal to the current datetime.
		let currentDateTime = new Date();
		let dateCreated_DateTime = new Date(jsonInput.dateCreated);
		if (dateCreated_DateTime.getTime() > currentDateTime.getTime()) {
			return { errorMsg: "Bad Request: field 'dateCreated' has a time value that is in the future - it's time value should be less than or equal to the current time" };
		}

		// Check that the number "nonce" field has a value that is greater than or equal to zero.
		if (jsonInput.nonce < 0) {
			return { errorMsg: "Bad Request: number field 'nonce' is less than 0 - it should be a number greater than or equal to 0" };
		}

		// The node finds the block candidate by its blockDataHash
		// Attempt to find the block candidate by it's blockDataHash
		if (!this.chain.miningJobs.has(jsonInput.blockDataHash)) {
			return { errorMsg: "Block not found or already mined" }
		}

		// Block Candidate for Mining Found
		let possibleNewBlockCandidate = this.chain.miningJobs.get(jsonInput.blockDataHash);

		// The node verifies the hash + its difficulty and builds the next block

		// The block candidate is merged with the nonce + timestamp + hash
		//
		// Let's put the appropriate values obtained from the JSON Input into the New Block Candidate
		// and calculate what the New Block Hash should be.
		possibleNewBlockCandidate.nonce = jsonInput.nonce;
		possibleNewBlockCandidate.dateCreated = jsonInput.dateCreated;
		possibleNewBlockCandidate.blockHash = possibleNewBlockCandidate.calculateBlockHash();

		// Verify that the given "jsonInput.blockHash" matches the newly calculated block hash.
		if (possibleNewBlockCandidate.blockHash !== jsonInput.blockHash) {
			return { errorMsg: "Bad Request: Incorrect 'blockHash' field value provided" }
		}

		// Verify that the given Block Hash matches the Block difficulty. So, according to the
		// Node/research/Network-Difficulty_Static-or-Dynamic.jpg file, if the Block Difficulty is a certain integer value,
		// then the Block Hash must have the same number of leading zeros in it.
		//
		// Reference for Coding Technique --> https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
		let leadingZeros = ''.padStart(possibleNewBlockCandidate.difficulty, '0');
		if (!possibleNewBlockCandidate.blockHash.startsWith(leadingZeros)) {
			return { errorMsg: "Bad Request: 'blockHash' field value provided does not match the Block difficulty" }
		}

		// Then if the block is still not mined, the chain is extended
		// Sometimes other miners can be faster --> the mined block is expired

		// Does there exist in the Blockchain a Block that is in the same slot that this "possibleNewBlockCandidate" is suppose to
		// occupy? In other words, has a Block with the same Block Index as this "possibleNewBlockCandidate" already present in the
		// Blockchain? If so, then we cannot place this "possibleNewBlockCandidate" in the Blockchain.
		if (possibleNewBlockCandidate.index != this.chain.blocks.length) {
			return { errorMsg: "Block with same Block Index already present in Blockchain" }
		}

		// Verify that the "possibleNewBlockCandidate.prevBlockHash" refers to the Block Hash of the last Block in the Blockchain. If not,
		// then this "possibleNewBlockCandidate" cannot be placed in the Blockchain.
		let lastBlockInBlockchain = this.chain.blocks[this.chain.blocks.length -1];
		if (possibleNewBlockCandidate.prevBlockHash !== lastBlockInBlockchain.blockHash) {
			return { errorMsg: "Previous Block Hash value of block does not equal the Block Hash of the last Block in the Blockchain" }
		}

		// At this point it is safe to add the "possibleNewBlockCandidate" into the Blockchain.
		this.chain.blocks.push(possibleNewBlockCandidate);

		// After a new block is mined in the network (by someone), all pending mining jobs are deleted (because they are no longer valid)
		// Coding Technique Reference --> https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
		this.chain.miningJobs.clear();

		// Now, we have to remove ALL the Transactions in the newly added "possibleNewBlockCandidate" from the Blockchain "pendingTransactions" list.
		for (let i = 0; i < possibleNewBlockCandidate.transactions.length; i++) {
			let transactionToRemoveFromPendingTransactions = possibleNewBlockCandidate.transactions[i];
			this.chain.pendingTransactions = this.chain.pendingTransactions.filter(aTransaction =>
				aTransaction.transactionDataHash !== transactionToRemoveFromPendingTransactions.transactionDataHash);
		}

		// Reference: Node/research/Implementing-the-Mining_Submit-Block.jpg file
		let response = {
				message: `Block accepted, reward paid: ${possibleNewBlockCandidate.transactions[0].value} microcoins`
		};

		return response;
	}

	// Debug: Mine a Block Endpoint
	// With this endpoint you can mine with the difficulty that you want. Use it only for debugging purposes.
	// RESTFul URL --> /debug/mine/{minerAddress}/{difficulty}
	//
	// It should mine the pending transaction(s) and create the next block.
	// Executes the entire mining process:
	// 1) get mining job: Execute "this.getMiningJob(minerAddress)" method
	// 2) calculate valid proof of work hash: Done inside this method
	// 2) submit the mined job: Execute "submitMinedBlock(jsonInput)" method
	//
	// References:
	// 1) Section "Debug: Mine a Block Endpoint" of the 4_practical-project-rest-api.pdf file
	// 2) Node/research/REST-Endpoints_Debug_Mine-a-Block.jpg file
	debugMineBlock(minerAddress, difficulty) {
		// Validate inputs
		if (!GeneralUtilities.isValidPublicAddress(minerAddress)) {
			return { errorMsg: "Bad Request: 'minerAddress' is not a 40-Hex string - it should be a 40-Hex string" };
		}
		if (!GeneralUtilities.isNumeric(difficulty)) {
			return { errorMsg: "Bad Request: 'difficulty' value is not positive numeric value - it should be a positive numeric value" };
		}

		// Convert to Integer.
		difficulty = parseInt(difficulty);

		// Get the Mining Job: This produces a Block to be mined in the "this.chain.miningJobs" Map.
		let realDifficulty = this.chain.currentDifficulty;
		this.chain.currentDifficulty = difficulty;
		let getMiningJobResponse = this.getMiningJob(minerAddress);
		this.chain.currentDifficulty = realDifficulty;
		if (getMiningJobResponse.hasOwnProperty("errorMsg")) {
			return response;
		}

		// Get the Block to be Mined
		let blockToBeMined = this.chain.miningJobs.get(getMiningJobResponse.blockDataHash);
		if (blockToBeMined === undefined) {
			return { errorMsg: "Cannot find the Block to be Mined in the Blockchain 'miningJobs' Map" }
		}

		// Calculate valid Proof of Work Hash.
		// Mine the Block and find the nonce UNTIL a successful mining is done.
		// Keep iterating in the loop until a Block Data Hash that meets the Block Difficulty level is found.
		blockToBeMined.dateCreated = new Date().toISOString();
		blockToBeMined.nonce = 0;
		let leadingZeros = ''.padStart(blockToBeMined.difficulty, '0');
		while (true) {
			blockToBeMined.blockHash = blockToBeMined.calculateBlockHash();
			if (blockToBeMined.blockHash.startsWith(leadingZeros)) {
				break;
			}
			blockToBeMined.nonce++;
		}

		// Submit the Mined Job
		let submitMinedJobJsonInput = {
				blockDataHash: blockToBeMined.blockDataHash,
				dateCreated: blockToBeMined.dateCreated,
				nonce: blockToBeMined.nonce,
				blockHash: blockToBeMined.blockHash
		}
		let submitMinedJobResponse = this.submitMinedBlock(submitMinedJobJsonInput);
		if (submitMinedJobResponse.hasOwnProperty("errorMsg")) {
			return submitMinedJobResponse;
		}

		// The last block in the blockchain is the one that just got mined. Thus, we need to check that this is so.
		let lastBlockInBlockchain = this.chain.blocks[this.chain.blocks.length - 1];
		if (lastBlockInBlockchain.blockHash !== blockToBeMined.blockHash) {
			return { errorMsg: `lastBlockInBlockchain.blockHash (${lastBlockInBlockchain.blockHash}) != blockToBeMined.blockHash (${blockToBeMined.blockHash})` }
		}

		let response = {
				index: lastBlockInBlockchain.index,
				transactions: lastBlockInBlockchain.transactions,
				difficulty: lastBlockInBlockchain.difficulty,
				minedBy: lastBlockInBlockchain.minedBy,
				dateCreated: lastBlockInBlockchain.dateCreated
		};

		return response;
	}

	// List All Peers Endpoint
	// This endpoint will return all the peers of the node.
	// RESTFul URL --> /peers
	//
	// References:
	// 1) Node/research/REST-Endpoints_List-All-Peers.jpg file
	// 2) Section "List All Peers Endpoint" of the Node/research/4_practical-project-rest-api.pdf file
	listAllPeers() {
		// Debug Code. Comment out.
		// this.peers.set("162269f6993d2b5440dddcd6", "http://localhost:5556");
		// this.peers.set('162266dff5753a87a3e72403', 'http://af6c7a.ngrok.org:5555');

		let response = GeneralUtilities.strMapToObj(this.peers);
		return response;
	}

	// Connect a Peer Endpoint
	// With this endpoint, you can manually connect to other nodes.
	// RESTFul URL --> /peers/connect
	//
	// The "axios" Node.js library is used to make RESTFul Web Service calls from JavaScript.
	// Sources where I found:
	// 1) https://www.twilio.com/blog/2017/08/http-requests-in-node-js.html
	// 2) https://github.com/axios/axios
	//
	// References:
	// 1) Section "Connect a Peer Endpoint" of the 4_practical-project-rest-api.pdf file
	// 2) Node/research/REST-Endpoints_Connect-a-Peer.jpg file
	// 3) Node/research/REST-Endpoints_Connect-a-Peer_Invalid.jpg file
	// 4) Node/research/Connecting-to-a-Peer.jpg file
	// 5) Node/research/Synchronizing-the-Chain-and-Pending-Transactions.jpg file
	// 6) Node/research/Validating-a-Chain.jpg file
	// 7) Node/research/Validating-a-Chain_2.jpg file
	// 8) Node/research/Deleting-Lost-Peers.jpg file
	async connectToPeer(jsonInput) {
		// Verify that the correct inputs are present.
		if (!jsonInput.hasOwnProperty("peerUrl")) {
			return {
				errorMsg: "Field 'peerUrl' is missing",
				errorType: badRequestErrorType
			}
		}

		// Verify that the inputs are of the correct type.
		if (typeof jsonInput.peerUrl !== 'string') {
			return {
				errorMsg: "Field 'peerUrl' is not a string - it should be an URL formatted non-empty string",
				errorType: badRequestErrorType
			}
		}

		// Trim the inputs that are strings
		jsonInput.peerUrl = jsonInput.peerUrl.trim();

		if (jsonInput.peerUrl.length === 0) {
			return {
				errorMsg: "Field 'peerUrl' is either an empty string or consists only of spaces - it should be an URL formatted non-empty string",
				errorType: badRequestErrorType
			}
		}

		// To avoid double connecting to the same peer:
		// 1) First get /info and check the nodeId
		// 2) Never connect twice to the same nodeId
		let restfulUrl = jsonInput.peerUrl + "/info";
		let responseData = undefined;
		await axios.get(restfulUrl, {timeout: restfulCallTimeout})
			.then(function (response) {
				// console.log('response = ', response);
				// console.log('response.data =', response.data);
				// console.log('response.status =', response.status);
				// console.log('response.statusText =', response.statusText);
				// console.log('response.headers =', response.headers);
				// console.log('response.config =', response.config);

				responseData = response.data;
			})
			.catch(function (error) {
				// console.log('error =', error);
  		});

  		// console.log('responseData =', responseData);

  		// If we cannot get the "/info" from the given "peerUrl", then...
  		if (responseData === undefined) {
			return {
				errorMsg: `Unable to connect to peer: ${jsonInput.peerUrl} - invalid URL provided that's not in the network`,
				errorType: badRequestErrorType
			}
		}

		// If the NodeId from the "/info" response is the same as this Node, then...
		if (responseData.nodeId === this.nodeId) {
			return {
				errorMsg: `Node ID of ${jsonInput.peerUrl} pertains to this node - cannot request that a node connect to itself as a peer`,
				errorType: confictErrorType
			}
		}

		// Debug Code Below. Comment out.
		// this.peers.set(responseData.nodeId, jsonInput.peerUrl);

		// If a node is already connected to given peer, return "409 Conflict"
		if (this.peers.has(responseData.nodeId)) {
			return {
				errorMsg: `Already connected to peer: ${jsonInput.peerUrl}`,
				errorType: confictErrorType
			}
		}

		// Debug Code Below. Comment Out.
		// responseData.chainId = "dummyvalue";

		// If the chain ID does not match, don't connect, return "400 Bad Request"
		if (this.chainId !== responseData.chainId) {
			return {
				errorMsg: `ChainId of ${jsonInput.peerUrl} Peer does not match ChainId of this node - attempting to connect to wrong blockchain`,
				errorType: badRequestErrorType
			}
		}

		// Debug Code Below. Comment Out.
		// responseData.peerUrl = "dummy";
		// console.log('responseData.nodeUrl =', responseData.nodeUrl);
		// console.log('jsonInput.peerUrl =', jsonInput.peerUrl);

		// If /info does not return the correct peerId... It is invalid or does not respond --> delete it.
		if (responseData.nodeUrl !== jsonInput.peerUrl) {
			return {
				errorMsg: `Peer Url from input (${jsonInput.peerUrl}) is not the same as Peer Url from calling the /info RESTFul Web Service (${responseData.peerUrl}) - something wrong`,
				errorType: badRequestErrorType
			}
		}

		// Debug Code below. Comment out.
		// this.peers.set("node_id_1", jsonInput.peerUrl);
		// this.peers.set("node_id_2", "dumny url");
		// this.peers.set("node_id_3", jsonInput.peerUrl);
		// console.log('this.peers (before deletion) =', this.peers);

		// To avoid double connecting to the same peer:
		// 1) First get /info and check the nodeId
		// 2) Never connect twice to the same nodeId
		//
		// I'll interpret the above to also mean for "peerUrl" values. What is there's more than ONE entry in the "peers" Map that
		// points to the same "peerUrl"? Nor clear from instructions on what should be done,. but I'll make a judgment call and remove
		// all such entries in the "peers" Map that has the given "peerUrl".
		let keys = Array.from(this.peers.keys());
		for (let i = 0; i < keys.length; i++) {
			let key = keys[i];
			if (this.peers.get(key) === jsonInput.peerUrl) {
				this.peers.delete(key);
			}
		}

		// Debug Code below. Comment out.
		// console.log('this.peers (after deletion) =', this.peers);

		// Now that we know that the "peerUrl" is valid and that no such "peers" exist in the "peers" Map, we can now
		// safely add the "peerUrl" to the "peers" Map.
		this.peers.set(responseData.nodeId, jsonInput.peerUrl);
		// console.log('this.peers = ', this.peers);

		// Always keep the connections bi-directional
		// If Alice is connected to Bob, then Bob should also be connected to Alice
		//
		// So let's do a /peers/connect to the "peerUrl" so that it's bi-directional.
		restfulUrl = jsonInput.peerUrl + "/peers/connect";
		let postJsonInput = { peerUrl: this.selfUrl };
		let peersConnectResponse = undefined;
		let peersConnectError = undefined;
		await axios.post(restfulUrl, postJsonInput, {timeout: restfulCallTimeout})
			.then(function (response) {
				// console.log('response = ', response);
				// console.log('response.data =', response.data);
				// console.log('response.status =', response.status);
				// console.log('response.statusText =', response.statusText);
				// console.log('response.headers =', response.headers);
				// console.log('response.config =', response.config);

				peersConnectResponse = response;
			})
			.catch(function (error) {
				// console.log('error =', error);
				peersConnectError = error;
  		});

  		// console.log('peersConnectResponse = ', peersConnectResponse);
		// console.log('peersConnectError =', peersConnectError);

		// If the RESTFul call to the peer yielded no response after the timeout, then just delete the peer node from the list of "peers".
		if (peersConnectResponse === undefined && peersConnectError === undefined) {
			this.peers.delete(responseData.nodeId);
			return {
				errorMsg: `Attempt to form bi-directional connection with ${jsonInput.peerUrl} peer failed due to timeout - removed ${jsonInput.peerUrl} as peer`,
				errorType: badRequestErrorType
			}
		}

		// After successful connection to a peer, try to synchronize the chain (if the peer has better chain) + synchronize the pending transactions

		// Attempt to synchronize Blocks with the Peer chain. Do not wait for the below asynchronous function to finish execution of this
		// synchronization, because it could take a LONG time.
		this.synchronizeChainFromPeerInfo(responseData);

		// Attempt to synchronize Pending Transactions with the Peer chain. Do not wait for the below asynchronous function to finish execution of this
		// synchronization, because it could take a LONG time.
		this.synchronizePendingTransactionFromPeer(responseData);

		response = {
				message: `Connected to peer: ${jsonInput.peerUrl}`
		}

		return response;
	}

    // Synchronizing the pending transactions from certain peer
    // 1) Download (i.e., Execute RESTFul Web Service) /transactions/pending and append the missing ones
    // 2) Transactions with the same hash should never be duplicated
    //
    // Reference: Node/research/Synchronizing-the-Chain-and-Pending-Transactions.jpg file
    //
    // Input: "peerInfo" information that was obtained by calling /info REST URL
    //        Checking of validity of the "peerInfo" attributes is responsibility of calling function.
	async synchronizePendingTransactionFromPeer(peerInfo) {
		console.log('Inside of synchronizePendingTransactionFromPeer!');

		if (peerInfo.pendingTransactions === 0) {
			return { message: "No pending transactions to sync with peer" };
		}

		let transactionsPendingRestfulUrl = peerInfo.nodeUrl + "/transactions/pending";
		let transactionsPendingResponseData = undefined;
		await axios.get(transactionsPendingRestfulUrl, {timeout: restfulCallTimeout})
			.then(function (response) {
				// console.log('response = ', response);
				// console.log('response.data =', response.data);
				// console.log('response.status =', response.status);
				// console.log('response.statusText =', response.statusText);
				// console.log('response.headers =', response.headers);
				// console.log('response.config =', response.config);

				transactionsPendingResponseData = response.data;
			})
			.catch(function (error) {
				// console.log('error =', error);
  		});

  		// console.log('responseData =', responseData);

		// If the RESTFul call to the peer yielded no response after the timeout or an error response, then just delete the peer node from the
		// list of "peers".
		if (transactionsPendingResponseData === undefined) {
			this.peers.delete(peerInfo.nodeId);
			return {
				errorMsg: `Peer ${peerInfo.nodeUrl} did not respond with Status OK from call to /transactions/pending - deleted as peer`
			}
		}

		// The "transactionsPendingResponseData" should have the following type of stucture:
		[
			{
				"from" : "f3a1e69b6176052fcc4a3248f1c5a91dea308ca9",
				"to" : "a1de0763f26176c6d68cc77e0a1c2c42045f2314",
				"value" : 400000,
				"fee" : 10,
				"dateCreated" : "2018-09-04T12:54:24.839Z",
				"data" : "Faucet -> Alice (again)",
				"senderPubKey" : "8c4431db61e9095d5794ff53a3ae4171c766cadef015f2e11bec22b98a80f74a0",
				"transactionDataHash" : "356c5628e7ab659b1d25765e332cfe6eec318008b96d0eba4dfd677032cc670b",
				"senderSignature" : [ "7787cc91d311b6e5d04acda388f1ce01990b636d8a8026e0fe86704e12c5c1ed",
					"6293c000ae4af69510f939d3f459e6d7e1da464ec91c7a0a08dd00dc0b3a6cdc" ]
			}
		]

		let response = {
				sendPendingTransactionSuccessResponses: [ ],
				sendPendingTransactionErrorResponses: [ ],
				transactionSendSuccessResponses: [ ],
				transactionSendErrorResponses [ ]
		}

		// Will assume that it's attributes are OK, but will leave checking with the called method.
		for (let i = 0; i < transactionsPendingResponseData.length; i++) {
			// The below function call will take care of following:
			// 1) Transactions with the same hash should never be duplicated
			// 2) Place the appropriate peer pending transactions into the "pendingTransactions" array
			let pendingTransaction = transactionsPendingResponseData[i];
			let sendTransactionResponse = this.sendTransaction(pendingTransaction);


			if (sendTransactionResponse.hasOwnProperty("errorMsg")) {
				response.sendPendingTransactionErrorResponses.push(sendTransactionResponse);
			}
			else {
				response.sendPendingTransactionSuccessResponses.push(sendTransactionResponse);

				// Notify all my peers about the new Pending Transaction that has been added
				// to the "pendingTransactions" from the peer. This is done via the
				// /transactions/send RESTFul Web Service call.

				// The response from the call to "sendTransaction" in this case is as follows:
				// { "transactionDataHash" : "cd8d9a345bb208c6f9b8acd6b8eef...20c8a" }

				// From the above, I conclude that all the needed inputs to the /transactions/send are in
				// the "pendindTransaction" variable. We'll just update it's "transactionDataHash" from
				// the "sendTransactionResponse" variable.
				pendingTransaction.transactionDataHash = sendTransactionResponse.transactionDataHash;

				let peerNodeIds = Array.from(node.peers.keys());
				let peerUrls = Array.from(node.peers.values());
				for (let i = 0; i = peerUrls.length; i++) {
					let peerUrl = peerUrls[i];
					let transactionsSendRestfulUrl = peerUrl + "/transactions/send";
					let transactionsSendResponseData = undefined;
					let transactionsSendError = undefined;
					await axios.post(restfulUrl, transactionToBroadcast, {timeout: restfulCallTimeout})
						.then(function (response) {
							// console.log('response = ', response);
							// console.log('response.data =', response.data);
							// console.log('response.status =', response.status);
							// console.log('response.statusText =', response.statusText);
							// console.log('response.headers =', response.headers);
							// console.log('response.config =', response.config);

							transactionsSendResponseData = response.data;
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

							transactionsSendError = error;
  					});

  					// If the RESTFul call to the peer yielded no response after the timeout, then just delete the peer node from the list of "peers".
					if (transactionsSendResponseData === undefined && transactionsSendError === undefined) {
						this.peers.delete(peerNodeIds[i]);

						response.transactionSendErrorResponses.push({
							errorMsg: `Peer ${peerUrl} did not respond after timeout period from call to /transactions/pending - deleted as peer``
						});
					}
					else if (transactionsSendError !== undefined) {
						response.transactionSendErrorResponses.push(transactionsSendError);
					}
					else if (transactionsSendResponseData !== undefined) {
						response.transactionSendSuccessResponses.push(transactionsSendResponseData);
					}

				} // end for (let i = 0; i = peerUrls.length; i++)

			} // end if (sendTransactionResponse.hasOwnProperty("errorMsg"))

		} // end for (let i = 0; i < transactionsPendingResponseData.length; i++)

		return response;
	}

	// Validates all the Transactions in a Block of a Peer
	//
	// Validate the transactions in the block
	// 1) Validate transaction fields and their values, recalculate the transaction data hash, validate the signature
	// 2) Re-execute all transactions, re calculate the values of minedInBlockIndex and transferSuccessful fields
	//
	// Inputs:
	// 1) blockToValidate : Has all the data members of the Block class. No need to verify, because it's already verified by the
	// 		calling function.
	// 2) previousTransactionDataHashesMap : Contains a Map of all the previous Transaction Data Hashes. The key is the Transaction
	//      Data Hash. The value is a reference to the Transaction.
	// 3) confirmedAccountBalancesMap : Contains the current confirmed balances of ALL the public address accounts. The key is the
	//      public address account. the value is the current account balance.
	//
	// Reference: Node/research/Validating-a-Chain.jpg file
	validateTransactionsInBlock(blockToValidate, previousTransactionDataHashesMap, confirmedAccountBalancesMap) {
		// Validate that the block has at least one transaction.
		if (blockToValidate.transactions.length === 0) {
			return { errorMsg: `Peer Block ${blockToValidate.index} has no Transactions - there should be at least one Transaction` };
		}

		// We need to keep track of the Coinbase Transaction value, which will be the sum of the following:
		// 1) The Block Reward: 5,000,000 micro-coins
		// 2) Sum of all the Fees of the Transactions that will be placed in the Next Block to be Mined
		//
		// Once we finish going throigh all the transactions of the block via the "for" loop, we will verify that the Coinbase Transaction has
		// the correct micro-coins in it's "value" field.
		//
		// Reference: Node/research/Coins-and-Rewards.jpg file
		let coinbaseTransactionValue = 5000000;

		// This is a Set to keep track of whether a "from" public address has previously appears in a Transaction in this "blockToValidate".
		// We are only allowing a limit of ONE transaction in which a "from" public address may appear in a block. If we see more than one
		// transaction in which a "from" public address has appeared, then the Peer chain is considered invalid.
		// We need this to check if
		//
		// Coding Technique use of Set Reference --> https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
		let fromAddressesThatHaveAppearedInTransaction = new Set();

		// Go through each Transaction and validate it.
		for (let i = 0; i < blockToValidate.transactions.length; i++) {
			let transactionToValidate = blockToValidate.transactions[i];

			// Check that all the expected fields in the transactionToValidate are present.
			if (!transactionToValidate.hasOwnProperty("from")) {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: field 'from' is missing` };
			}
			if (!transactionToValidate.hasOwnProperty("to")) {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: field 'to' is missing` };
			}
			if (!transactionToValidate.hasOwnProperty("value")) {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: field 'value' is missing` };
			}
			if (!transactionToValidate.hasOwnProperty("fee")) {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: field 'fee' is missing` };
			}
			if (!transactionToValidate.hasOwnProperty("dateCreated")) {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: field 'dateCreated' is missing`};
			}
			if (!transactionToValidate.hasOwnProperty("data")) {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: field 'data' is missing` };
			}
			if (!transactionToValidate.hasOwnProperty("senderPubKey")) {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: field 'senderPubKey' is missing` };
			}
			if (!transactionToValidate.hasOwnProperty("transactionDataHash")) {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: field 'transactionDataHash' is missing` };
			}
			if (!transactionToValidate.hasOwnProperty("senderSignature")) {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: field 'senderSignature' is missing` };
			}
			if (!transactionToValidate.hasOwnProperty("minedInBlockIndex")) {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: field 'minedInBlockIndex' is missing` };
			}
			if (!transactionToValidate.hasOwnProperty("transferSuccessful")) {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: field 'transferSuccessful' is missing` };
			}

			// Check that all the expected fields are of the correct type.
			if (typeof transactionToValidate.from !== 'string') {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: field 'from' is not a string - it should be a 40-Hex lowercase string` };
			}
			if (typeof transactionToValidate.to !== 'string') {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: field 'to' is not a string - it should be a 40-Hex lowercase string` };
			}
			if (!Number.isInteger(transactionToValidate.value)) {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: field 'value' is not an integer - it should be an integer greater than or equal to 0` };
			}
			if (!Number.isInteger(transactionToValidate.fee)) {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: field 'fee' is not an integer - it should be an integer greater than or equal to 10` };
			}
			if (typeof transactionToValidate.dateCreated !== 'string') {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: field 'dateCreated' is not a string - it should be an ISO8601 date string as follows: YYYY-MM-DDTHH:MN:SS.MSSZ` };
			}
			if (typeof transactionToValidate.data !== 'string') {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: field 'data' is not a string - it should be a string` };
			}
			if (typeof transactionToValidate.senderPubKey !== 'string') {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: field 'senderPubKey' is not a string - it should be a 65-Hex lowercase string` };
			}
			if (typeof transactionToValidate.transactionDataHash !== 'string') {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: field 'transactionDataHash' is not a string - it should be a 64-Hex lowercase string` };
			}
			if (!Array.isArray(transactionToValidate.senderSignature)) {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: field 'senderSignature' is not an array - it should be a 2-element array of [64-hex lowercase string][64-hex lowercase string]` };
			}
			if (!Number.isInteger(transactionToValidate.minedInBlockIndex)) {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: field 'minedInBlockIndex' is not an integer - it should be an integer greater than or equal to 0 and equal to the Block Index number it was mined` };
			}
			if (typeof transactionToValidate.transferSuccessful !== 'boolean') {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: field 'transferSuccessful' is not a boolean - it should be a boolean` };
			}

			// Check that the "senderSignature" is a two-element array.
			if (transactionToValidate.senderSignature.length !== 2) {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: array field 'senderSignature' does not have 2 elements - it should be a 2-element array of [64-hex lowercase string][64-hex lowercase string]` };
			}

			// Check that the first and second elements of the "senderSignature" array are each strings
			if (typeof transactionToValidate.senderSignature[0] !== 'string') {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: first element of array field 'senderSignature' is not a string - it should be a 64-hex lowercase string` };
			}
			if (typeof transactionToValidate.senderSignature[1] !== 'string') {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: second element of array field 'senderSignature' is not a string - it should be a 64-hex lowercase string` };
			}

			// Check that the "to" and "from" fields have valid Public Address string values.
			if (!GeneralUtilities.isValidPublicAddress(transactionToValidate.from)) {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: string field 'from' is not a 40-Hex string - it should be a 40-Hex lowercase string` };
			}
			if (!GeneralUtilities.isValidPublicAddress(transactionToValidate.to)) {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: string field 'to' is not a 40-Hex string - it should be a 40-Hex lowercase string` };
			}

			// Check that the number "value" field has a value that is greater than or equal to zero.
			if (transactionToValidate.value < 0) {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: number field 'value' is less than 0 - it should be a number greater than or equal to 0` };
			}

			// Check that the "dateCreated" field is a valid ISO8601 date string.
			if (!GeneralUtilities.isValid_ISO_8601_date(transactionToValidate.dateCreated)) {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: field 'dateCreated' is not an ISO8601 date string - it should be an ISO8601 date string as follows: YYYY-MM-DDTHH:MN:SS.MSSZ` };
			}

			// Check that the "dateCreated" field's datetime is less than or equal to the current datetime.
			let currentDateTime = new Date();
			let dateCreated_DateTime = new Date(transactionToValidate.dateCreated);
			if (dateCreated_DateTime.getTime() > currentDateTime.getTime()) {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: field 'dateCreated' has a time value that is in the future - it's time value should be less than or equal to the current time` };
			}

			// Check that the "data" field has no white space neither at the beginning nor at the end.
			if (transactionToValidate.data !== transaction.data.trim()) {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: field 'data' has white space at the beginning and/or the end - it should have no such white space` };
			}

			// Check that the "transactionDataHash" field is a valid 64-Hex lower case string
			if (!GeneralUtilities.isValid_64_Hex_string(transactionToValidate.transactionDataHash)) {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: string field 'transactionDataHash' is not a 64-Hex lowercase string - it should be a 64-Hex lowercase string` };
			}

			// Check that the "minedInBlockIndex" field has a value that equals the block index of the Block that it is inside.
			if (transactionToValidate.minedInBlockIndex !== blockToValidate.index) {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: field 'minedInBlockIndex' is not equal to the Block Index number of the Block that it is inside` };
			}

			// Now is a good time to see if the "from" public address has appeared before in a Transaction in this "blockToValidate".
			if (fromAddressesThatHaveAppearedInTransaction.has(transactionToValidate.from)) {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: the 'from' public address ${transactionToValidate.from} appears in more than one transaction in the block - a 'from' public address may appear in only one transation in a block` };
			}
			fromAddressesThatHaveAppearedInTransaction.add(transactionToValidate.from);

			// Create a copy of the "transactionToValidate" so that we can have the "transactionDataHash" automatically re-calculated and check
			// that the "transactionToValidate.transactionDataHash" field has the correct calue.
			let transactionToValidateCopy = new Transaction(
					transactionToValidate.from, // address (40 hex digits) string
					transactionToValidate.to, // address (40 hex digits) string
					transactionToValidate.value, // integer (non negative)
					transactionToValidate.fee, // integer (non negative)
					transactionToValidate.dateCreated, // ISO8601_string
					transactionToValidate.data, // string (optional)
					transactionToValidate.senderPubKey, // hex_number[65] string
					transactionToValidate.senderSignature, // hex_number[2][64] : 2-element array of (64 hex digit) strings
					transactionToValidate.minedInBlockIndex, // integer / null
					transactionToValidate.transferSuccessful); { // boolean
			if (transactionToValidate.transactionDataHash !== transactionToValidateCopy.transactionDataHash) {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: field 'transactionDataHash' has an incorrect calculated value` };
			}

			// Let's verify if there exists a previous Transaction with the same "transactionDataHash" value. If no such previous Transaction exists, then
			// add it to the "previousTransactionDataHashesMap".
			if (previousTransactionDataHashesMap.has(transactionToValidate.transactionDataHash)) {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: there exists previusly in the blockchain a transaction with the same 'transactionDataHash' value: ${transactionToValidate.transactionDataHash}` };
			}
			previousTransactionDataHashesMap.set(transactionToValidate.transactionDataHash, transactionToValidate);

			// Check that the "senderPubKey" field is a valid Public Key string value.
			if (!GeneralUtilities.isValidPublicKey(transactionToValidate.senderPubKey)) {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: field 'senderPubKey' is not a 65-Hex lowercase string - it should be a 65-Hex lowercase string` };
			}

			// Check that the first and second elements of the "senderSignature" array are each 64-Hex string
			if (!GeneralUtilities.isValidSignatureElement(transactionToValidate.senderSignature[0])) {
				return { errorMsg: `Invalid transaction: first element of array field 'senderSignature' is not a 64-hex lowercase string value - it should be a 64-hex lowercase string` };
			}
			if (!GeneralUtilities.isValidSignatureElement(transactionToValidate.senderSignature[1])) {
				return { errorMsg: `Invalid transaction: second element of array field 'senderSignature' is not a 64-hex lowercase string value - it should be a 64-hex lowercase string` };
			}

            // If this is the first Transaction in the Block, then we need to verify that it's a Coinbase Transaction with the correct values.
			if (i === 0) {
				// Verify correct "from" address value
				if (transactionToValidate.from !== GenesisBlock.allZeros_40_Hex_PublicAddress) {
					return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Coinbase Transaction ${i}: field 'from' is not equal a 40-Hex all zeros string value` };
				}

				// Verify correct "fee" value
				if (transactionToValidate.fee !== 0) {
					return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Coinbase Transaction ${i}: field 'fee' is not equal to 0 (zero) - instead it's equal to ${transactionToValidate.fee}` };
				}

				// Verify that the "value" field is at least equal to the Block Reward of 5,000,000 micro-coins
				if (transactionToValidate.value < coinbaseTransactionValue) {
					return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Coinbase Transaction ${i}: field 'value' is not equal to at least the block reward of ${coinbaseTransactionValue} micro-coins` };
				}

				// Verify the correct "data" value depending upon whether this is the Genesis Block or not.
				if (transactionToValidate.minedInBlockIndex === 0) {
					if (transactionToValidate.data !== "genesis tx") {
						return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Genesis Block Coinbase Transaction ${i}: field 'data' is not equal to 'genesis tx' string` };
					}
				}
				else {
					if (transactionToValidate.data !== "coinbase tx") {
						return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Coinbase Transaction ${i}: field 'data' is not equal to 'coinbase tx' string` };
					}
				}

				// Verify that the "senderPubKey" field is an all Zeros 65-Hex string
				if (transactionToValidate.senderPubKey != GenesisBlock.allZeros_65_Hex_String) {
					return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Coinbase Transaction ${i}: field 'senderPubKey' is not equal to an all zeros 65-Hex string` };
				}

				// Check that the first and second elements of the "senderSignature" array are each all Zeros 64-hex strings
				if (transactionToValidate.senderSignature[0] !== GenesisBlock.allZeros_64_Hex_String) {
					return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Coinbase Transaction ${i}: first element of array field 'senderSignature' is not an all zeros 64-hex string` };
				}
				if (transactionToValidate.senderSignature[1] !== GenesisBlock.allZeros_64_Hex_String) {
					return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Coinbase Transaction ${i}: second element of array field 'senderSignature' is not an all zeros 64-hex string` };
				}

				// Verify that the "transferSuccessful" field has a boolean true value
				if (!transactionToValidate.transferSuccessful) {
					return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Coinbase Transaction ${i}: field 'transferSuccessful' is equal to boolean false - it should be equal to boolean true` };
				}

				// Check first to see if the "to" Public Addess is in the "confirmedAccountBalancesMap", and if it is not, then add it initially with
				// a balance of 0.
				if (!confirmedAccountBalancesMap.has(transactionToValidate.to)) {
					confirmedAccountBalancesMap.set(transactionToValidate.to, 0);
				}

				// Now add in the correct balance for the Coinbase Transaction "to" Public Address to the "confirmedAccountBalancesMap".
				// No need to worry about the "fee" for the Coinbase Transation, because it will always be zero.
				let tempAmount = confirmedAccountBalancesMap.get(transactionToValidate.to);
				tempAmount += transactionToValidate.value;
				confirmedAccountBalancesMap.set(transactionToValidate.to, tempAmount);

				continue;

			} // end if (i === 0)

			// Check that the number "fee" field has a value that is greater than or equal to 10.
			if (transactionToValidate.fee < 10) {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: number field 'fee' is less than 10 - it should be a number greater than or equal to 10` };
			}

			// Validate the "senderPubKey": Make sure that the Public Address obtained from the "senderPubKey" matches the "to" Address.
			let calculatedSenderPublicAddress = CryptoUtilities.getPublicAddressFromPublicKey(transactionToValidate.senderPubKey);
			if (transactionToValidate.from !== calculatedSenderPublicAddress) {
				return { errorMsg: `Invalid transaction: field 'senderPubKey' does not match the 'from' public address when derving the public address from the public key` };
			}

			// Validate the "senderSignature" to make sure that the "from" Public Address signed the Transaction.
			let validSignature = CryptoUtilities.verifySignature(
					transactionToValidate.transactionDataHash,
					transactionToValidate.senderPubKey,
					{ r: transactionToValidate.senderSignature[0], s: transactionToValidate.senderSignature[1]} );
			if (!validSignature) {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: Invalid signature in the 'senderSignature' field` };
			}

			// Now, we are ready to do some re-calculation to make sure that there are enough balances in the accounts inside of the Transaction at the
			// time the Transaction was supposedly made. We do these re-calculations and if anywhere in these re-calculations we run into a situation
			// where the "from" Public Address does not have enough of a balance to complete the Transaction, then we may have to consider the Peer
			// Chain invalid bases upon the "transferSuccessful" value.
			if (!confirmedAccountBalancesMap.has(transactionToValidate.from)) {
				confirmedAccountBalancesMap.set(transactionToValidate.from, 0);
			}
			if (!confirmedAccountBalancesMap.has(transactionToValidate.to)) {
				confirmedAccountBalancesMap.set(transactionToValidate.to, 0);
			}

			// Does the "from" Public Address have enough to cover the "transactionToValidate.fee"? If not, then this Transaction should NEVER had been
			// placed in a Block.
			if (confirmedAccountBalancesMap.get(transactionToValidate.from) < transactionToValidate.fee) {
				return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: Transaction in chain where the ${transactionToValidate.from} 'from' public address does not have enough to cover the ${transactionToValidate.fee} micro-coins amount - balance at the time was ${confirmedAccountBalancesMap.get(transactionToValidate.from)} micro-coins` };
			}

			// Let's update the "coinbaseTransactionValue".
			coinbaseTransactionValue += transactionToValidate.fee;

			// Let's delete the "fee" amount from the "from" public address, because whether the Transaction was successful or not, this "fee" will get
			// deleted from the "from" public address.
			let tempAmount = confirmedAccountBalancesMap.get(transactionToValidate.from);
			tempAmount -= transactionToValidate.fee;
			confirmedAccountBalancesMap.set(transactionToValidate.from, tempAmount);

			// After deleting for the "fee", does the "from" public address have enough to cover the "value" amount? If it does not, then the Transaction
			// should have been flagged as unsuccessful; otherwise, it should have been flagged as successful.
			if (confirmedAccountBalancesMap.get(transactionToValidate.from) < transactionToValidate.value) {

				// Not enough to cover the "value", so check to see if "transactionToValidate.transferSuccessful" is "false".
				if (transactionToValidate.transferSuccessful !== false) {
					return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: It's 'transferSuccessful' field is boolean true, but should be boolean false due to 'from' address not having enough to cover the 'value' field amount of micro-coins after deducting for the 'fee' amount - should have been boolean false.` };
				}

			}
			else { // "transactionToValidate.transferSuccessful" should have been set to "true"

				// Enough to cover the "value", so check to see if "transactionToValidate.transferSuccessful" is "true".
				if (transactionToValidate.transferSuccessful !== true) {
					return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Transaction ${i}: It's 'transferSuccessful' field is boolean false, but should be boolean true due to 'from' address having enough to cover the 'value' field amount of micro-coins after deducting for the 'fee' amount - should have been boolean false.` };
				}

				// Let's delete the "value" amount from the "from" public address, since the "from" public address has enough to cover the
				// "value" amount.
				let tempAmount = confirmedAccountBalancesMap.get(transactionToValidate.from);
				tempAmount -= transactionToValidate.value;
				confirmedAccountBalancesMap.set(transactionToValidate.from, tempAmount);

				// Let's add the "value" amount to the "to" public address, since the "from" public address has enough to cover the
				// "value" amount.
				let tempAmount = confirmedAccountBalancesMap.get(transactionToValidate.to);
				tempAmount += transactionToValidate.value;
				confirmedAccountBalancesMap.set(transactionToValidate.to, tempAmount);
			}

		} // end for loop

		// OK.. Now that we have calculated the true "coinbaseTransactionValue" by adding in the fees, we need to check that the Coinbase Transaction
		// "value" field has the correct value. If it does not, then this Peer Chain is inavlid.
		if (blockToValidate.transactions[0].value !== coinbaseTransactionValue) {
			return { errorMsg: `Peer Block ${blockToValidate.index} has invalid Coinbase Transaction 0: It's 'value' field does not equal the total of all the fees and block rewards - 'value' field is ${blockToValidate.transactions[0].value} but should be ${coinbaseTransactionValue}` };
		}

		return { message: "successful validate of peer block ${blockToValidate.index}" };
	}

	// This function validates all the blocks in the "blocksToValidate" input parameter. The "blocksToValidate" is an array
	// of type Block.
	//
	// Input Parameters:
	// 1) peerCumulativeDifficulty : Cummulative Difficulty that came from the Peer /info RESTFul Web Service
	// 2) blocksToValidate : The Chain of Blocks from the Peer /blocks RESTFul Web Service
	//
	// References:
	// 1) Node/research/Validating-a-Chain.jpg file
	// 2) Node/research/Validating-a-Chain_2.jpg file
	validateDownloadedPeerChain(peerCumulativeDifficulty, blocksToValidate) {
		// Verify that thet blocks are in an array
		if (!Array.isArray(blocksToValidate)) {
			return {
				errorMsg: "Peer Blocks are not an array of Block object - they should be an array of Block objects",
				errorType: badRequestErrorType
			};
		}

		// Verify that size of Peer Blocks Array is greater than 0
		if (blocksToValidate.length < 1) {
			return {
				errorMsg: "Peer Blocks is empty - has no Genesis Block",
				errorType: badRequestErrorType
			};
		}

		// Validate the genesis block --> should be exactly the same (i.e., all Genesis Blocks are identical)
		// Therefore, if they are supposed to be identical, just take a simple Hash of the entire Block 0 and
		// BOTH of their hashes sould be the same.
		try {
			let thisNode_genesisBlock_totalHash = CryptoJS.SHA256(JSON.stringify(this.chain.blocks[0])).toString();
			let peerNode_genesidBlock_totalHash = CryptoJS.SHA256(JSON.stringify(blocksToValidate[0])).toString();
			if (thisNode_genesisBlock_totalHash !== peerNode_genesisBlock_totalHash) {
				return {
					errorMsg: "Peer Genesis Block is not valid",
					errorType: badRequestErrorType
				};
			}
		}
		catch (error) {
			return {
				errorMsg: "Peer Genesis Block is not valid",
				errorType: badRequestErrorType
			};
		}

		// Re-calculate the cumulative difficulty of the incoming chain: We'll keep a counter to re-calculate and check later if what got
		// sent from the Peer's /info matches the commulative calculated from the blocks obtained from the Peer's /blocks RESTFul Url call.
		// We'll start off with the Genesis Block.
		let reCalculatedCummulativeDifficulty = 16 ** blocksToValidate[0].difficulty;

		// Let's keep track of all the previous Block Hahes so that as we check through the blocks we can verify that no previous Block has
		// the same Block Hash. The "key" will be the Block Hash, while the "value" will be a reference to the Block.
		let previousBlockHashes = new Map();
		previousBlockHashes.set(blocksToValidate[0].blockHash, blocksToValidate[0]);

		// Let's keep track of all the previous Transaction Data Hashes so that as we check through the Transactions we can verify that no previous
		// Trasnaction has the same Transaction Data Hash. The "key" will be the Transaction Data Hash, while the "value" will be a reference to the
		// Transaction.
		let previousTransactionDataHashes = new Map();
		previousTransactionDataHashes.set(blocksToValidate[0].transactions[0].transactionDataHash, blocksToValidate[0].transactions[0]);

		// let's keep track of all the confirmed balances of the Peer Chain Transactions as we re-calculate ALL the Transactions to make sure
		// that each such Transaction is able to be done based on the account balance at the time of the Transaction.
		let confirmedAccountBalances = new Map();
		confirmedAccountBalances.set(blocksToValidate[0].transactions[0].to, blocksToValidate[0].transactions[0].value);

		// Validate each block from the first to the last. We've already checked the Genesis Block, so we start at index 1.
		for (let i = 1; i < blocksToValidate.length; i++) {
			let blockToValidate = blocksToValidate[i];

			// Validate that all block fields are present and have valid values

			// Validate that the Block has all its fields present
			if (blockToValidate.hasOwnProperty("index")) {
				return {
					errorMsg: `Peer Block ${i} has no 'index' field`,
					errorType: badRequestErrorType
				};
			}
			if (blockToValidate.hasOwnProperty("transactions")) {
				return {
					errorMsg: `Peer Block ${i} has no 'transactions' field`,
					errorType: badRequestErrorType
				};
			}
			if (blockToValidate.hasOwnProperty("difficulty")) {
				return {
					errorMsg: `Peer Block ${i} has no 'difficulty' field`,
					errorType: badRequestErrorType
				};
			}
			if (blockToValidate.hasOwnProperty("prevBlockHash")) {
				return {
					errorMsg: `Peer Block ${i} has no 'prevBlockHash' field`,
					errorType: badRequestErrorType
				};
			}
			if (blockToValidate.hasOwnProperty("minedBy")) {
				return {
					errorMsg: `Peer Block ${i} has no 'minedBy' field`,
					errorType: badRequestErrorType
				};
			}
			if (blockToValidate.hasOwnProperty("blockDataHash")) {
				return {
					errorMsg: `Peer Block ${i} has no 'blockDataHash' field`,
					errorType: badRequestErrorType
				};
			}
			if (blockToValidate.hasOwnProperty("nonce")) {
				return {
					errorMsg: `Peer Block ${i} has no 'nonce' field`,
					errorType: badRequestErrorType
				};
			}
			if (blockToValidate.hasOwnProperty("dateCreated")) {
				return {
					errorMsg: `Peer Block ${i} has no 'dateCreated' field`,
					errorType: badRequestErrorType
				};
			}
			if (blockToValidate.hasOwnProperty("blockHash")) {
				return {
					errorMsg: `Peer Block ${i} has no 'blockHash' field`,
					errorType: badRequestErrorType
				};
			}

			// Validate that all the fields of the Block are of the correct type
			if (!Number.isInteger(blockToValidate.index)) {
				return {
					errorMsg: `Peer Block ${i} has an 'index' field that is not an integer - it should be an integer equal to ${i}`,
					errorType: badRequestErrorType
				};
			}
			if (!Array.isArray(blockToValidate.transactions)) {
				return {
					errorMsg: `Peer Block ${i} has a 'transactions' field that is not an array - it should be an array with Transaction objects`,
					errorType: badRequestErrorType
				};
			}
			if (!Number.isInteger(blockToValidate.difficulty)) {
				return {
					errorMsg: `Peer Block ${i} has an 'difficulty' field that is not an integer - it should be an integer greater than or equal to 0`,
					errorType: badRequestErrorType
				};
			}
			if (typeof blockToValidate.prevBlockHash !== 'string')) {
				return {
					errorMsg: `Peer Block ${i} has a 'prevBlockHash' field that is not a string - it should be a 64-hex number lowercase string`,
					errorType: badRequestErrorType
				};
			}
			if (typeof blockToValidate.minedBy !== 'string')) {
				return {
					errorMsg: `Peer Block ${i} has a 'minedBy' field that is not a string - it should be a public address 40-hex number lowercase string`,
					errorType: badRequestErrorType
				};
			}
			if (typeof blockToValidate.blockDataHash !== 'string')) {
				return {
					errorMsg: `Peer Block ${i} has a 'blockDataHash' field that is not a string - it should be a 64-hex number lowercase string`,
					errorType: badRequestErrorType
				};
			}
			if (!Number.isInteger(blockToValidate.nonce)) {
				return {
					errorMsg: `Peer Block ${i} has a 'nonce' field that is not an integer - it should be an integer greater than or equal to 0`,
					errorType: badRequestErrorType
				};
			}
			if (typeof blockToValidate.dateCreated !== 'string')) {
				return {
					errorMsg: `Peer Block ${i} has a 'dateCreated' field that is not a string - it should be an ISO8601 date string as follows: YYYY-MM-DDTHH:MN:SS.MSSZ`,
					errorType: badRequestErrorType
				};
			}
			if (typeof blockToValidate.blockHash !== 'string')) {
				return {
					errorMsg: `Peer Block ${i} has a 'blockHash' field that is not a string - it should be a 64-hex number lowercase string`,
					errorType: badRequestErrorType
				};
			}

			// Validate that all block fields have valid values
			if (blockToValidate.index !== i) {
				return {
					errorMsg: `Peer Block ${i} has an 'index' field with an incorrect integer value of ${blockToValidate.index} - it should be an integer equal to ${i}`,
					errorType: badRequestErrorType
				};
			}
			if (blockToValidate.difficulty < 0) {
				return {
					errorMsg: `Peer Block ${i} has a 'difficulty' field value that is less than 0 - it should be an integer greater than or equal to 0`,
					errorType: badRequestErrorType
				};
			}
			if (!GeneralUtilities.isValid_64_Hex_string(blockToValidate.prevBlockHash)) {
				return {
					errorMsg: `Peer Block ${i} has a 'prevBlockHash' field that is not a 64-hex number lowercase string - it should be a 64-hex number lowercase string`,
					errorType: badRequestErrorType
				};
			}
			if (!GeneralUtilities.isValidPublicAddress(blockToValidate.minedBy)) {
				return {
					errorMsg: `Peer Block ${i} has a 'minedBy' field that is not a public address 40-hex number lowercase string - it should be a public address 40-hex number lowercase string`,
					errorType: badRequestErrorType
				};
			}
			if (!GeneralUtilities.isValid_64_Hex_string(blockToValidate.blockDataHash)) {
				return {
					errorMsg: `Peer Block ${i} has a 'blockDataHash' field that is not a 64-hex number lowercase string - it should be a 64-hex number lowercase string`,
					errorType: badRequestErrorType
				};
			}
			if (blockToValidate.nonce < 0) {
				return {
					errorMsg: `Peer Block ${i} has a 'nonce' field that is an integer less than 0 - it should be an integer greater than or equal to 0`,
					errorType: badRequestErrorType
				};
			}
			if (!GeneralUtilities.isValid_ISO_8601_date(blockToValidate.dateCreated)) {
				return {
					errorMsg: `Peer Block ${i} has a 'dateCreated' field that is not valid ISO8601 date string - it should be an ISO8601 date string as follows: YYYY-MM-DDTHH:MN:SS.MSSZ`,
					errorType: badRequestErrorType
				};
			}
			if (!GeneralUtilities.isValid_64_Hex_string(blockToValidate.blockHash)) {
				return {
					errorMsg: `Peer Block ${i} has a 'blockHash' field that is not a 64-hex number lowercase string - it should be a 64-hex number lowercase string`,
					errorType: badRequestErrorType
				};
			}

			// Re-calculate the block data hash and block hash of the block, but before we do, let's create a Block instance with the correct
			// field values from the "blockToValidate".
			let blockToValidateCopy = new Block(
					blockToValidate.index, // Index: integer (unsigned)
					blockToValidate.transactions, // Transactions : Transaction[]
					blockToValidate.difficulty, // Difficulty: integer (unsigned)
					blockToValidate.prevBlockHash, // PrevBlockHash: hex_number[64] string
					blockToValidate.minedBy, // MinedBy: address (40 hex digits) string

					// Assigned by the Miners
					blockToValidate.nonce, // Nonce: integer (unsigned)
					blockToValidate.dateCreated, // DateCreated : ISO8601_string
					blockToValidate.blockHash); // // BlockHash: hex_number[64] string

			// Re-calculate the block data hash of the block and make sure that it's equal to the "blockToValidate.blockDataHash" value.
			if (blockToValidate.blockDataHash !== blockToValidateCopy.calculateBlockDataHash()) {
				return {
					errorMsg: `Peer Block ${i} has an incorrectly calculated 'blockDataHash' field value`,
					errorType: badRequestErrorType
				};
			}

			// Re-calculate the block hash of the block and make sure that it's equal to the "blockToValidate.blockHash" value.
			if (blockToValidate.blockHash !== blockToValidateCopy.calculateBlockHash()) {
				return {
					errorMsg: `Peer Block ${i} has an incorrectly calculated 'blockHash' field value`,
					errorType: badRequestErrorType
				};
			}

			// Verify that the "blockToValidate.blockHash" is not the Block Hash of a previous block. If it's not, then place it in the
			// "previousBlockHashes" Map for future reference.
			if (previousBlockHashes.has(blockToValidate.blockHash)) {
				return {
					errorMsg: `Peer Block ${i} has 'blockHash' field value that is the same as a previous block - each block in the blockchain should have a unique block hash`,
					errorType: badRequestErrorType
				};
			}
			previousBlockHashes.set(blockToValidate.blockHash, blockToValidate);

			// Ensure the block hash matches the block difficulty
			let leadingZeros = ''.padStart(blockToValidate.difficulty, '0');
			if (!blockToValidate.blockHash.startsWith(leadingZeros)) {
				return { errorMsg: `Peer Block ${i} has a 'blockHash' field value that does not match it's Block difficulty` }
			}

			// Validate that prevBlockHash == the hash of the previous block
			if (blockToValidate.prevBlockHash !== blocks[i-1].blockHash) {
				return {
					errorMsg: `Peer Block ${i} has a 'prevBlockHash' field value that is not equal to the 'blockHash' field value of previous Peer Block ${i-1} - they should have the same value`,
					errorType: badRequestErrorType
				};
			}

			// Re-calculate the cumulative difficulty of the incoming chain
			reCalculatedCummulativeDifficulty += 16 ** blockToValidate.difficulty;

			// Validate the transactions in the block
			let validateTransactionsResponse = this.validateTransactionsInBlock(blockToValidate, previousTransactionDataHashes, confirmedAccountBalances);
			if (validateTransactionsResponse.hasOwnProperty("errorMsg")) {
				return {
					errorMsg: validateTransactionsResponse,
					errorType: badRequestType
				}
			}
		}

		// Let's check to see that the "peerCumulativeDifficulty" was calculated correctly by the Peer. It should equal the
		// "reCalculatedCummulativeDifficulty" we just calculated.
		if (peerCumulativeDifficulty !== reCalculatedCummulativeDifficulty) {
			return {
				errorMsg: `Peer Blockchain has incorrectly calculated it's 'cummulativeDifficulty' - cannot use this peer chain`,
				errorType: badRequestErrorType
			};
		}

		// If the cumulative difficulty > current cumulative difficulty, then Replace the current chain with the incoming chain
		if (this.chain.calculateCumulativeDifficulty() >= peerCumulativeDifficulty) {
			return {
				errorMsg: `Peer cumulative difficulty is NOT greater than this node's cumulative difficulty - cannot use this peer chain`,
				errorType: badRequestErrorType
			};
		}

		response = { message: "successful validation" }
		return response;
	}

	// Synchronizing the chain from certain peer:
	// 1) First get /info (fed in as the "peerInfo" argument) and check the peer's chain cumulative difficulty
	// 2) If the peer chain has bigger difficulty, download it from /blocks
	// 3) Validate the downloaded peer chain (blocks, transactions, etc.)
	// 4) If the peer chain is valid, replace the current chain with it
	// 5) Notify all peers about the new chain
	//
	// Checking of validity of the "peerInfo" attributes is responsibility of calling function.
	//
	// Reference: Node/research/Synchronizing-the-Chain-and-Pending-Transactions.jpg file
	async synchronizeChainFromPeerInfo(peerInfo) {
		console.log("Inside of synchronizeChainFromPeerInfo!");
		// If the Peer Chain has less then or equal to the cummlative difficulty of this chain, then just return.
		if (peerInfo.cumulativeDifficulty <= this.chain.calculateCumulativeDifficulty()) {
			return { message: `Chain from ${peerInfo.nodeUrl} has a 'cumulativeDifficulty' that is less than or equal to this Node's chain - will not synchronize with peer` };
		}

		// At this point, we know that the Peer Chain has greater cummlative difficulty than this chain. So, get the Peer Chain's blocks.

		let restfulUrlBlocks = peerInfo.nodeUrl + "/blocks";
		let responseDataBlocks = undefined;
		await axios.get(restfulUrl, {timeout: restfulCallTimeout})
			.then(function (response) {
				// console.log('response = ', response);
				// console.log('response.data =', response.data);
				// console.log('response.status =', response.status);
				// console.log('response.statusText =', response.statusText);
				// console.log('response.headers =', response.headers);
				// console.log('response.config =', response.config);

				responseDataBlocks = response.data;
			})
			.catch(function (error) {
				// console.log('error =', error);
  		});

		// If an attempt is made to do a simple /blocks RESTFul call to the Peer fails, then just remove the peer from the list of "peers".
		// This should not happen if everything is OK.
  		if (responseDataBlocks === undefined) {
			this.peers.delete(peerInfo.nodeId);
			return {
				errorMsg: `Attempt to call RESTFul ${restfulUrlBlocks} on peer failed - removed ${peerInfo.nodeUrl} as peer`,
				errorType: badRequestErrorType
			}
		}

		// Validate the downloaded peer chain (blocks, transactions, etc.)
		let responseValidation = this.validateDownloadedPeerChain(peerInfo.cumulativeDifficulty, responseDataBlocks);
		if (responseValidation.hasOwnProperty("errorMsg")) {
			return responseValidation;
		}

		// At this point, the Peer's Blockchain blocks have been properly validated. So, go ahead and replace our Blochchain blocks with those of
		// our Peer.
		this.chain.blocks = responseDataBlocks;

		// As per Patrick Galloway: When you synchronize your node's chain with that of your peer, you should also clear all the "miningJobs",
		//    because ususally that means that the blockchain is now longer and so all of the current jobs would fail anyways. Also if you don't
		//    clear it that node won't be able to produce the next block because it would then only clear on the block after.
		//
		// References:
		// 1) Node/research/Patrick-Galloway_ClearMiningJobs_one-you-synchronize_with_another-peer-chain.jpg file
		// 2) Node/research/Validating-a-Chain_2.jpg file
		this.chain.miningJobs.clear();

		let response = {
				message: `Successfully synchronized this peer ${this.selfUrl} blockchain with other peer ${peerInfo.nodeUrl} blockchain`,
				warnings: [ ]
		}

		// Notify all peers about the new chain
		// I believe that the RESTFul Web Service URL to call is: /peers/notify-new-block
		let peerUrls = Array.from(this.peers.values());
		let peerNodeIds = Array.from(this.peers.keys());
		for (let i = 0; peerUrls.length; i++) {
			let peerUrl = peerUrls[i];

			let restfulUrlPeerNotifyNewBlock = peerUrl + "/peers/notify-new-block";
			let peerNotifyBlockJsonInput = {
					blocksCount: peerInfo.blocksCount,
					cumulativeDifficulty: peerInfo.cumulativeDifficulty,
					nodeUrl: peerInfo.nodeUrl
			}
			let responsePeerNotifyNewBlock = undefined;
			await axios.post(restfulUrlPeerNotifyNewBlock, peerNotifyBlockJsonInput, {timeout: restfulCallTimeout})
				.then(function (axiosResponse) {
					// console.log('response = ', response);
					// console.log('response.data =', response.data);
					// console.log('response.status =', response.status);
					// console.log('response.statusText =', response.statusText);
					// console.log('response.headers =', response.headers);
					// console.log('response.config =', response.config);

					responsePeerNotifyNewBlock = axiosResponse;
				})
				.catch(function (error) {
					// console.log('error =', error);
  			});

  			if (responsePeerNotifyNewBlock === undefined) {
				response.warnings.push(`Call to ${restfulUrlPeerNotifyNewBlock} did not respond with OK Status - removing ${peerUrl} from list of peers`);
			}
		}

		return response;
	}

	// Notify Peers about New Block Endpoint
	// This endpoint will notify the peers about a new block.
	// RESTFul URL --> /peers/notify-new-block
	//
	// References:
	// 1) Node/research/REST-Endpoints_Notify-Peers-about-New_Block.jpg file
	// 2) Section "Notify Peers about New Block Endpoint" of the 4_practical-project-rest-api.pdf file
	// 3) Node/research/Notifying-all-Connected-Peers.jpg file
	//
	// Not sure what professor wants from this, but if this Node receives this type of RESTFul Web Service call, then
	// we should syncronize with the node from the receiving Peer is it's chain has a higher "cumulativeDifficulty".
	//
	notifyPeersAboutNewBlock(jsonInput) {
		// Check that all the expected fields in the jsonInput are present.
		if (!jsonInput.hasOwnProperty("blocksCount")) {
			return { errorMsg: "Bad Request: field 'blocksCount' is missing" };
		}
		if (!jsonInput.hasOwnProperty("cumulativeDifficulty")) {
			return { errorMsg: "Bad Request: field 'cumulativeDifficulty' is missing" };
		}
		if (!jsonInput.hasOwnProperty("nodeUrl")) {
			return { errorMsg: "Bad Request: field 'nodeUrl' is missing" };
		}

		// Check that the expected fields in the jsonInput are of the correct type.
		if (!Number.isInteger(jsonInput.blocksCount)) {
			return { errorMsg: "Bad Request: field 'blocksCount' is not an integer - it should be an integer greater than or equal to 1" };
		}
		if (!Number.isInteger(jsonInput.cumulativeDifficulty)) {
			return { errorMsg: "Bad Request: field 'cumulativeDifficulty' is not an integer - it should be an integer greater than or equal to 0" };
		}
		if (typeof jsonInput.nodeUrl !== 'string') {
			return { errorMsg: "Bad Request: field 'nodeUrl' is not a string - it should be a string with a length greater than or equal to 1" };
		}

		// The "blocksCount" should be equal to 1 or more sue to Genesis Block always being present at the very least.
		if (jsonInput.blocksCount < 1) {
			return { errorMsg: "Bad Request: field 'blocksCount' has an integer value less than 1 - it should be an integer greater than or equal to 1" };
		}

		// The "cumulativeDifficulty" should be greater than or equal to 0.
		if (jsonInput.cumulativeDifficulty < 0) {
			return { errorMsg: "Bad Request: field 'blocksCount' has an integer value less than 0 - it should be an integer greater than or equal to 0" };
		}

		jsonInput.nodeUrl = jsonInput.nodeUrl.trim();

		if (jsonInput.nodeUrl.length == 0) {
			return { errorMsg: "Bad Request: field 'nodeUrl' is an empty or white spaces string - it should be a non-white space string with a length greater than or equal to 1" };
		}

		// It may take a while to sync with a Peer Node, so will not wait for the result.
		this.synchronizeChainFromPeerInfo(jsonInput);

		let response = { "message": "Thank you for the notification." };
		return response;
	}
};