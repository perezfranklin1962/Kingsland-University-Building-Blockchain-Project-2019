var GenesisBlock = require('./GenesisBlock');

module.exports = class Blockchain {

	constructor() {
		this.blocks = [GenesisBlock.genesisBlock]; // Blocks: Block[]
		this.pendingTransactions = []; // PendingTransactions : Transaction[]

		// When I executed the https://stormy-everglades-34766.herokuapp.com/debug/reset-chain URL and
		// then viewed the results of the https://stormy-everglades-34766.herokuapp.com/info URL, I noticed
		// that the "currentDifficulty" was "5", so I will alsi initialize the Blockchain "currentDifficulty"
		// with "5".
		this.currentDifficulty = 5; // CurrentDifficulty : integer

		// Idea obtained from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map web page.
		this.miningJobs = new Map(); // MiningJobs: map(blockDataHash --> Block);
	}
};