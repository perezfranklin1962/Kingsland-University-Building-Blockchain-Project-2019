module.exports = class Node {

	// General information
	// Endpoint for receiving general information about the node.
	getGeneralInformation() {
		let response = {
				message: "The /info RESTFul URL has been called!"
		};

		return response;
	}

	// Debug endpoint
	// This endpoint will print everything about the node. The blocks, peers, chain, pending transactions and much more.
	getDebugInformation() {
		let response = {
				message: "The /debug RESTFul URL has been called!"
		};

		return response;
	}

	// Reset the chain Endpoint
	// This endpoint will reset the chain and start it from the beginning; this is used only for debugging.
	resetChain() {
		let response = {
				message: "The /reset-chain RESTFul URL has been called!"
		};

		return response;
	}

	// All blocks Endpoint
	// The endpoint will print all the blocks in the node’s chain.
	getBlocksInformation() {
		let response = {
				message: "The /blocks RESTFul URL has been called!"
		};

		return response;
	}

	// Block by Index Endpoint
	// The endpoint will print the block with the index that you specify
	getBlockInformation(blockIndex) {
		let response = {
				message: `The /block/${blockIndex} RESTFul URL has been called!`
		};

		return response;
	}

	// Get Pending Transactions Endpoint
	// This endpoint will print the list with transactions that have not been mined.
	getPendingTransactions() {
		let response = {
				message: "The /transactions/pending RESTFul URL has been called!"
		};

		return response;
	}

	// Get Confirmed Transactions
	// This endpoint will print the list of the transactions that are included in blocks.
	getConfirmedTransactions() {
		let response = {
				message: "The /transactions/confirmed RESTFul URL has been called!"
		};

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