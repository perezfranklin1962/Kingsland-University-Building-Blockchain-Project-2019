// Need below to do SHA-256 Hash
// Reference --> https://cryptojs.gitbook.io/docs
var CryptoJS = require('crypto-js');

module.exports = class Block {

	constructor(
		index, // Index: integer (unsigned)
		transactions, // Transactions : Transaction[]
		difficulty, // Difficulty: integer (unsigned)
		prevBlockHash, // PrevBlockHash: hex_number[64] string
		minedBy, // MinedBy: address (40 hex digits) string

		// Assigned by the Miners
		nonce, // Nonce: integer (unsigned)
		dateCreated, // DateCreated : ISO8601_string
		blockHash = undefined) { // BlockHash: hex_number[64] string

		this.index = index; // Index: integer (unsigned)
		this.transactions = transactions; // Transactions : Transaction[]
		this.difficulty = difficulty; // Difficulty: integer (unsigned)
		this.prevBlockHash = prevBlockHash; // PrevBlockHash: hex_number[64] string
		this.minedBy = minedBy; // MinedBy: address (40 hex digits) string

		// Below will be SHA256 of the above
		this.blockDataHash = this.calculateBlockDataHash(); // BlockDataHash: hex_number[64] string

		// Not 100% clear from Project Material or recorded lecture what the Block Hash should be
		// exactly, but I believe from the "Node/research/Building-the-Blockchain-Node_Blocks.jpg" file,
		// it's the SHA-256 Hash of the concatenation of the following:
		// 1) Block Data Hash
		// 2) Nonce
		// 3) DateCreated
		if (blockHash === undefined) { // BlockHash: hex_number[64] string
			this.blockHash = this.calculateBlockHash(); // BlockHash: hex_number[64] string
		}
		else {
			this.blockHash = blockHash; // The Block Hash may be done by the Miner
		}
	}

	// Calculating the Block Data Hash
	//
	// The block data hash is calculated by SHA256 hashing the JSON representation of
	// following block fields (in exactly this order):
	// 1) 'index'
	// 2) 'transactions', each holding these:
	//    a) 'from'
	//    b) 'to',
	//    c) 'value'
	//    d) 'fee'
	//    e) 'dateCreated'
	//    f) 'data'
	//    g) 'senderPubKey'
	//    h) 'transactionDataHash'
	//    i) 'senderSignature'
	//    j) 'minedInBlockIndex'
    //    k) 'transferSuccessful'
    // 3) 'difficulty'
    // 4) 'prevBlockHash'
    // 5) 'minedBy'
	calculateBlockDataHash() {
		let transactionsDataListJson = [];
		for (let i = 0; i < this.transactions.length; i++) {
			let transactionJson = this.transactions[i];
			let transactionDataToAddJson = {
				'from': transactionJson.from,
				'to': transactionJson.to,
				'value': transactionJson.value,
				'fee': transactionJson.fee,
				'dateCreated': transactionJson.dateCreated,
				'transactionDataHash': transactionJson.transactionDataHash,
				'senderSignature': transactionJson.senderSignature,
				'minedInBlockIndex': transactionJson.minedInBlockIndex,
				'transferSuccessful': transactionJson.transferSuccessful
			};

			transactionsDataListJson.push(transactionDataToAddJson)
		}

		let blockDataToHashJson = {
			'index': this.index,
			'transactions': transactionsDataListJson,
			'difficulty': this.difficulty,
			'prevBlockHash': this.prevBlockHash,
			'minedBy': this.minedBy
		}

		let blockDataToHashJsonString = JSON.stringify(blockDataToHashJson);
		let blockDataHash = CryptoJS.SHA256(blockDataToHashJsonString);
		let blockDataHashString = blockDataHash.toString();

		return blockDataHashString;
	}

	// Calculating the Block Hash
	//
	// Not 100% clear from Project Material or recorded lecture what the Block Hash should be
	// exactly, but I believe from the "Node/research/Building-the-Blockchain-Node_Blocks.jpg" file,
	// it's the SHA-256 Hash of the concatenation of the following:
	// 1) Block Data Hash
	// 2) Nonce
	// 3) DateCreated
	//
	// This function should only be executed AFTER the BlockDataHash has been calculated.
	calculateBlockHash() {
		let blockHashDataToHashString = this.blockDataHash + this.nonce + this.dateCreated;
		let blockHash = CryptoJS.SHA256(blockHashDataToHashString);
		let blockHashString = blockHash.toString();
		return blockHashString;
	}

};