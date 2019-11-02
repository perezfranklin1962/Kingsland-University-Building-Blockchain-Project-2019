// Need below to do SHA-256 Hash
// Reference --> https://cryptojs.gitbook.io/docs
var CryptoJS = require('crypto-js');

module.exports = class Transaction {

	constructor(
		from, // address (40 hex digits) string
		to, // address (40 hex digits) string
		value, // integer (non negative)
		fee, // integer (non negative)
		dateCreated, // ISO8601_string
		data, // string (optional)
		senderPubKey, // hex_number[65] string
		senderSignature, // hex_number[2][64] : 2-element array of (64 hex digit) strings

		// The two arguments below are optional, because there's the possibility that one is instantianting a new
		// Transaction to be placed in the Pending Transactions List and NONE of these transactions have yet to be
		// mined.
		minedInBlockIndex = null, // integer / null
		transferSuccessful = false) { // boolean

		this.from = from; // address (40 hex digits) string
		this.to = to; // address (40 hex digits) string
		this.value = value; // integer (non negative)
		this.fee = fee; // integer (non negative)
		this.dateCreated = dateCreated; // ISO8601_string
		this.data = data; // string (optional)
		this.senderPubKey = senderPubKey; // hex_number[65] string
		this.senderSignature = senderSignature; // hex_number[2][64] : 2-element array of (64 hex digit) strings
		this.minedInBlockIndex = minedInBlockIndex; // integer / null
		this.transferSuccessful = transferSuccessful; // boolean

		this.transactionDataHash = this.calculateTransactionDataHash();
	}

	// Calculating the Transaction Data Hash (SHA-256 Hash)
	//
	// Calculated by the transaction data fields only:
    // 1) 'from', 'to', 'value', 'fee', 'dateCreated', 'data', 'senderPubKey'
    // 2) Does not include the signature and execution info (the mined block index + success of the execution)
    //
    // Sources:
    // 1)File: Nodes/research/Building-the-Blockchain-Node_Transactions.jpg
    // 2)File: Nodes/research/Calculating-the-Transaction-Data-Hash.jpg
    //
    // Although not stated, I'll calculate the JSON formatted string of the
    // 'from', 'to', 'value', 'fee', 'dateCreated', 'data', and 'senderPubKey' fields.
	calculateTransactionDataHash() {
		let transactionDataToHashJson = {
			'from': this.from,
			'to': this.to,
			'value': this.value,
			'fee': this.fee,
			'dateCreated': this.dateCreated,
			'data': this.data,
			'senderPubKey': this.senderPubKey
		};

		let transactionDataToHashJsonString = JSON.stringify(transactionDataToHashJson);
		let transactionDataHash = CryptoJS.SHA256(transactionDataToHashJsonString);
		let transactionDataHashString = transactionDataHash.toString();

		return transactionDataHashString;
	}
};