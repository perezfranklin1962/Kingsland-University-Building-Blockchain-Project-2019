var GenesisBlock = require('./GenesisBlock');
var GeneralUtilities = require('./GeneralUtilities');

module.exports = class Blockchain {

	constructor() {
		this.blocks = [GenesisBlock.genesisBlock]; // Blocks: Block[]
		this.pendingTransactions = []; // PendingTransactions : Transaction[]

		// When I executed the https://stormy-everglades-34766.herokuapp.com/debug/reset-chain URL and
		// then viewed the results of the https://stormy-everglades-34766.herokuapp.com/info URL, I noticed
		// that the "currentDifficulty" was "5", so I will also initialize the Blockchain "currentDifficulty"
		// with "5".
		// this.currentDifficulty = 5; // CurrentDifficulty : integer
		// this.currentDifficulty = 4; // Used for demo as recommened by Patrick Galloway
		this.currentDifficulty = 3; // For testing only
		// this.currentDifficulty = 6; // Probably not a good idea.

		// Idea obtained from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map web page.
		this.miningJobs = new Map(); // MiningJobs: map(blockDataHash --> Block);
	}

	// Reference: "General information" Section of the Node/research/4_practical-project-rest-api.pdf file
	// confirmedTransactions – transactions that have been included in a block
	calculateNumberOfConfirmedTransactions() {
		let numberOfConfirmedTransactions = 0;
		for (let i = 0; i < this.blocks.length; i++) {
			numberOfConfirmedTransactions += this.blocks[i].transactions.length;
		}

		return numberOfConfirmedTransactions;
	}

	// Reference: "General information" Section of the Node/research/4_practical-project-rest-api.pdf file
	// confirmedTransactions – transactions that have been included in a block
	getConfirmedTransactions() {
		let transactions = [];
		for (let i = 0; i < this.blocks.length; i++) {
			for (let j = 0; j < this.blocks[i].transactions.length; j++) {
				transactions.push(this.blocks[i].transactions[j]);
			}
		}

		return transactions;
	}

	// Returns back an array of BOTH Confirmed and Pending Transactions.
	getAllTransactions() {
		let allTransactions = [];

		// Idea for below came from the https://stackoverflow.com/questions/9650826/append-an-array-to-another-array-in-javascript
		// web page.
		allTransactions.push.apply(allTransactions, this.getConfirmedTransactions());
		allTransactions.push.apply(allTransactions, this.pendingTransactions);

		return allTransactions;
	}

	// Returns back an array of BOTH Confirmed and Pending Transactions associated with a given Public Address.
	//
	// References for use of "filter" on a JavaScript array:
	// 1) https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
	// 2) https://medium.com/poka-techblog/simplify-your-javascript-use-map-reduce-and-filter-bd02c593cc2d
	getAllTransactionsFromPublicAddress(publicAddress) {
		let allTransactions = this.getAllTransactions();
		let allTransactionsForPublicAddress = allTransactions.filter(transaction =>
			transaction.to === publicAddress || transaction.from === publicAddress);

		return allTransactionsForPublicAddress;
	}

	// Reference: "General information" Section of the Node/research/4_practical-project-rest-api.pdf file
	// confirmedTransactions – transactions that have been included in a block
	//
	// Reference: The "Debug endpoint" Section of the Node/research/4_practical-project-rest-api.pdf file
	// confirmedBalances – The balances of everyone: From what I interpret, this would be to get the balances of
	// ALL the Public Addresses based on the confirmed Transactions.
	//
	// Reference: Node/research/REST-Endpoints_List-All-Account-Balances.jpg file
	//
	// Output: JavaScript Map object where each key is a Public Address (40 hex digits) string and it's corresponding
	//         value is an integer value showing the balance on that Public Address (40 hex digits).
	getBalancesOfAllAddressesFromConfirmedTransactions() {
		let confirmedTransactions = this.getConfirmedTransactions();
		let addressBalances = new Map();

		for (let i = 0; i < confirmedTransactions.length; i++) {
			let transaction = confirmedTransactions[i];

			if (!addressBalances.has(transaction.from)) {
				addressBalances.set(transaction.from, 0);
			}

			if (!addressBalances.has(transaction.to)) {
				addressBalances.set(transaction.to, 0);
			}

			// The "from" address in a Transaction ALWAYS pays the fee.
			let tempBalance = addressBalances.get(transaction.from);
			tempBalance -= transaction.fee;
			addressBalances.set(transaction.from, tempBalance)

			// The Coins ONLY transfer if the Transaction was successful.
			if (transaction.transferSuccessful) {
				tempBalance = addressBalances.get(transaction.from);
				tempBalance -= transaction.value;
				addressBalances.set(transaction.from, tempBalance);

				tempBalance = addressBalances.get(transaction.to);
				tempBalance += transaction.value;
				addressBalances.set(transaction.to, tempBalance);
			}
		}

		return addressBalances;
	}

	// Reference: Node/research/Calculating-the-Cumulative-Difficulty.jpg file
	// cumulativeDifficulty == 16 ** d[0] + 16 ** d[1] + … 16 ** d[n]
	//    where d[0], d[1], … d[n] are the individual difficulties of the blocks
	calculateCumulativeDifficulty() {
		let cumulativeDifficulty = 0;
		for (let i = 0; i < this.blocks.length; i++) {
			cumulativeDifficulty += 16 ** this.blocks[i].difficulty;
		}

		return cumulativeDifficulty;
	}

	// Recalculates current difficulty if a certain number of past blocks have been mined.
	//
	// Returns - boolean value interpreted as follows:
	// 1) true  : current difficulty has been recalculated and changed
	// 2) false : current difficulty has either not been recalculated or has not changed
	recalculateCurrentDifficulty() {
		let blockInterval = 50; // number of blocks

		// let targetBlockTime = 30000; // milliseconds
		let targetBlockTime = 25000; // milliseconds
		// let targetBlockTime = 20000; // milliseconds
		// let targetBlockTime = 15000; // milliseconds
		// let targetBlockTime = 10000; // milliseconds
		// let targetBlockTime = 5000; // milliseconds
		// let targetBlockTime = 2500; // milliseconds

		let moduloDivision = this.blocks.length % blockInterval;
		if (moduloDivision !== 0) {
			return false;
		}

		let numberOfBlockIntervalsCovered = 0;
		// let numberOfBlockIntervalsToCover = this.blocks.length;
		let numberOfBlockIntervalsToCover = blockInterval;
		let blockIndex = this.blocks.length - 1;
		let totalBlockTimes = 0;
		while (true) {
			let previousBlockIndex = blockIndex - 1;

			// I will not count the Genesis Block, because it's "dateCreated" is hard-coded to a timestamp
			// that is not recent and will throw off the average.
			if (previousBlockIndex < 1) {
				break;
			}

			let firstBlockDateTime = new Date(this.blocks[previousBlockIndex].dateCreated);
			let secondBlockDateTime = new Date(this.blocks[blockIndex].dateCreated);

			let thisBlockTime = Math.abs(secondBlockDateTime.getTime() - firstBlockDateTime.getTime());
			totalBlockTimes += thisBlockTime;

			numberOfBlockIntervalsCovered += 1;
			if (numberOfBlockIntervalsCovered >= numberOfBlockIntervalsToCover) {
				break;
			}

			blockIndex -= 1;
			if (blockIndex < 1) {
				break;
			}
		}

		let averageBlockTime = totalBlockTimes / numberOfBlockIntervalsCovered;
		console.log('averageBlockTime =', averageBlockTime);
		console.log('   totalBlockTimes =', totalBlockTimes);
		console.log('   numberOfBlockIntervalsCovered =', numberOfBlockIntervalsCovered);

		if (averageBlockTime < targetBlockTime) {
			this.currentDifficulty += 1;
			console.log('   this.currentDifficulty =', this.currentDifficulty);
			return true;
		}
		if (averageBlockTime > targetBlockTime) {
			this.currentDifficulty -= 1;
			if (this.currentDifficulty < 0) {
				this.currentDifficulty = 0;
			}

			console.log('   this.currentDifficulty =', this.currentDifficulty);
			return true;
		}

		return false;
	}

	// This method returns back a copy of this Blockchain JavaScript Object and returns back a JavaScript Object
	// that is in a JSON format. Of particular concern is ANY attribute that is a Map, because when using JSON.stringify,
	// problems occur as explained in the GeneralUtilities.strMapToObj method.
	getAsJsonObject() {
		let jsonObject = Object.create({});
		jsonObject.blocks = this.blocks;
		jsonObject.pendingTransactions = this.pendingTransactions;
		jsonObject.currentDifficulty = this.currentDifficulty;
		jsonObject.miningJobs = GeneralUtilities.strMapToObj(this.miningJobs);

		return jsonObject;
	}
};