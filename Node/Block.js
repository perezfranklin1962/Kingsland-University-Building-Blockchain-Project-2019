module.exports = class Block {

	constructor(
		index, // Index: integer (unsigned)
		transactions, // Transactions : Transaction[]
		difficulty, // Difficulty: integer (unsigned)
		prevBlockHash, // PrevBlockHash: hex_number[64]
		minedBy, // MinedBy: address (40 hex digits)

		// Below will be SHA256 of the above
		blockDataHash, // BlockDataHash: hex_number[64]

		// Assigned by the Miners
		nonce, // Nonce: integer (unsigned)
		dateCreated, // DateCreated : ISO8601_string
		blockHash // BlockHash: hex_number[64]
};