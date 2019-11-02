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
		this.currentDifficulty = 5; // CurrentDifficulty : integer

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