// Need below to do Hash Functionality functions
var CryptoJS = require('crypto-js');

// Need below to instantiate and get a handle on the Blockchain object.
var Blockchain = require('./Blockchain');

var GeneralUtilities = require('./GeneralUtilities');
var CryptoUtilities = require('./CryptoUtilities');
var Transaction = require('./Transaction');

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

		// Validate that the "senderSignature" to make sure that the "from" Public Address signed the Transaction.
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
			return { errorMsg: "Invalid transaction: not enough account balance in the 'to' address for the given 'value' and 'fee' amounts" };
		}

		// Put the "newTransaction" in the "pending transactions" pool
		this.chain.pendingTransactions.push(newTransaction);

		let response = { transactionDataHash: newTransaction.transactionDataHash };
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