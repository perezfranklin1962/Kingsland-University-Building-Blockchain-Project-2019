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

	// Reference: "General information" Section of the Node/research/4_practical-project-rest-api.pdf file
	// confirmedTransactions – transactions that have been included in a block
	calculateConfirmedTransactions() {
		let numberOfConfirmedTransactions = 0;
		for (let i = 0; i < this.blocks.length; i++) {
			numberOfConfirmedTransactions += this.blocks[i].transactions.length;
		}

		return numberOfConfirmedTransactions;
	}

	// Reference: Node/research/Calculating-the-Cumulative-Difficulty.jpg file
	// cumulativeDifficulty == 16 ** d[0] + 16 ** d[1] + … 16 ** d[n]
	//    where d[0], d[1], … d[n] are the individual difficulties of the blocks
	calculateCumulativeDifficulty() {
		cumulativeDifficulty = 0;
		for (let i = 0; i < this.blocks.length; i++) {
			cumulativeDifficulty += 16 ** this.blocks[i].difficulty;
		}

		return cumulativeDifficulty;
	}
};