const Block = require('./Block');
const Transaction = require('./Transaction');

// Found out by using the "Node/research/FranklinCryptoUtility.js" script.
var faucetPublicAddress = "fce3a061a500b8f3fb10eb29a55f24941f7444de";

const allZeros_40_Hex_PublicAddress = "0000000000000000000000000000000000000000";

const allZeros_65_Hex_String = "00000000000000000000000000000000000000000000000000000000000000000";

const allZeros_64_Hex_String = "0000000000000000000000000000000000000000000000000000000000000000";

// According to the Node/research/The-Genesis-Block_The-Start-of-the-Chain.jpg source, it
// should be a constant in ISO8601_string date format.
const genesisDateCreated = "2019-11-01T18:51:24.965Z";

// Source: Node/research/Coins-and-Rewards.jpg file
//
// 1 coin = 1,000 milli-coins = 1,000,000 micro-coins
//
// Total Blockchain Supply of Tokens: 1 Trillion micro-coins (i.e., 1,000,000,000,000 micro-coins)
//                                    1 Billion milli-coins (i.e., 1,000,000,000 milli-coins)
//                                    1 Million coins (i.e., 1,000,000 coins)
const totalBlockchainNumberOfMicroCoins = 1000000000000; // 1 Trillion (micro-coins)

// Source: Node/research/The-Faucet-Transaction-in-the-Genesis-Block.jpg file
const genesisCoinbaseTransaction = new Transaction(
	allZeros_40_Hex_PublicAddress, // from: address (40 hex digits) string
	faucetPublicAddress, // to: address (40 hex digits) string
	totalBlockchainNumberOfMicroCoins, // value: integer (non negative)
	0, // fee: integer (non negative)
	genesisDateCreated, // ISO8601_string
	"genesis tx", // data: string (optional)
	allZeros_65_Hex_String, // senderPubKey: hex_number[65] string
	[allZeros_64_Hex_String, allZeros_64_Hex_String], // senderSignature: hex_number[2][64] : 2-element array of (64 hex digit) strings
	0, // minedInBlockIndex: integer / null
	true); // transferSuccessful: boolean

// Source: Node/research/The-Genesis-Block_The-Start-of-the-Chain.jpg file
//
// No specification on what to put in the PrevBlockHas, so I'll make a judgement call
// and set it to "0".
const genesisBlock = new Block(
	0, // Index: integer (unsigned)
	[genesisCoinbaseTransaction], // Transactions : Transaction[]
	0, // Difficulty: integer (unsigned)
	"0", // PrevBlockHash: hex_number[64] string
	allZeros_40_Hex_PublicAddress, // MinedBy: address (40 hex digits) string
	0, // Nonce: integer (unsigned)
	genesisDateCreated); // DateCreated : ISO8601_string

module.exports = {
	genesisBlock,
	allZeros_65_Hex_String,
	allZeros_64_Hex_String
};