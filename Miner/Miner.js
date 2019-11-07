// Miner Implementation
//
// References:
// 1) Miner/research/3_practical-project-implement-miner.pdf file
// 2) Miner/research/The-Mining-Process_Preparation.jpg file
// 3) Miner/research/The-Mining-Process_Trying-Many-Hashes.jpg file

// Need below to do Hash Functionality functions
var CryptoJS = require('crypto-js');

var GeneralUtilities = require('../Node/GeneralUtilities');

// The "axios" Node.js library is used to make RESTFul Web Service calls from JavaScript.
// Sources where I found:
// 1) https://www.twilio.com/blog/2017/08/http-requests-in-node-js.html
// 2) https://github.com/axios/axios
var axios = require('axios');

// As per Patrick Galloway:
// 1) If there is an error in communications, or if the peer take longer than 60 seconds to respond, the peer should be dropped.
// 2) If I call a peer with ANY RESTFul Web Service and I get back an error or there's no response in 60 seconds, I will drop the peer.
//
// References:
// 1) Node/research/Patrick-Galloway_What-to-do-if-Peer-does=not-respond-or-errors-out.jpg file
// 2) https://medium.com/@masnun/handling-timeout-in-axios-479269d83c68
var restfulCallTimeout = 60000; // 60 seconds or 60000 milliseconds

var listeningNodePort = 5555;
var listeningNodeHostNameOrIP_Address = "localhost";
var minerPublicAddress = 'b63a0fe3f5f5ffc6a800f51594eee600082ad57f';
var mineOnlyOnce = false;

// The "commander" Node.js library was used to easily handle command-line arguments.
var commander = require('commander');
commander
	.usage('[OPTIONS]...')
	.option('-lp, --listeningNodePort <Port Number>', 'Listening Node Port Number', listeningNodePort)
	.option('-lh, --listeningNodeHost <Host Name or IP Address>', 'Listening Node Host Name or IP Address', listeningNodeHostNameOrIP_Address)
	.option('-ma, --minerPublicAddress <Public Address (40-Hex lowercase)>', 'Miner Public Address', minerPublicAddress)
	.option('-on, --mineOnlyOnce <Mine Only Once (boolean flag)>', 'Mine Only Once flag', mineOnlyOnce)
	.parse(process.argv);

// console.log('commander.listeningNodePort =', commander.listeningNodePort);

if (GeneralUtilities.isNumeric(commander.listeningNodePort)) {
	listeningNodePort = commander.listeningNodePort;
}
else {
	console.log(`Listening Node Port Argument entered is not a number: Will use default ${listeningNodePort} port.`);
}

if (commander.listeningNodeHost.length > 0) {
	listeningNodeHostNameOrIP_Address = commander.listeningNodeHost;
}
else {
	console.log(`Listening Node Host Argument entered is an empty string: Will use default ${listeningNodeHostNameOrIP_Address} Node Host.`);
}

if (GeneralUtilities.isValidPublicAddress(commander.minerPublicAddress)) {
	minerPublicAddress = commander.minerPublicAddress;
}
else {
	console.log(`Miner Public Address entered is not a valid 40-Hex lowercase string: Will use default ${minerPublicAddress} Miner Public Address.`);
}

if (commander.mineOnlyOnce === 'true') {
	mineOnlyOnce = true;
}
else if (commander.mineOnlyOnce === 'false') {
	mineOnlyOnce = false;
}
else {
	console.log(`Mine Only Once boolean flag entered is not a valid boolean value: Will use default '${mineOnlyOnce}' value.`)
}


console.log();
console.log('Listening Node Host Name or IP Address -->', listeningNodeHostNameOrIP_Address);
console.log('Listening Node Port Number -->', listeningNodePort);
console.log('Miner Public Address -->', minerPublicAddress);
console.log();

let nodeUrl = `http://${listeningNodeHostNameOrIP_Address}:${listeningNodePort}`;
console.log('Node URL -->', nodeUrl);
console.log();

// Calculating the Block Hash
//
// From the Node/research/Building-the-Miners-Hash.jpg file, I conclude that the Block Hash is the
// "|" Pipe concatenation of the following:
// 1) Block Data Hash
// 2) Nonce
// 3) DateCreated
//
function calculateBlockHash(blockToBeMined) {
	let blockHashDataToHashString = `${blockToBeMined.blockDataHash}|${blockToBeMined.nonce}|${blockToBeMined.dateCreated}`;
	let blockHash = CryptoJS.SHA256(blockHashDataToHashString);
	let blockHashString = blockHash.toString();
	return blockHashString;
}

// Implementing the Miner
//
// In an infinite loop repeat the following steps:
// 1) Take a mining job from the Node through its REST API.
// 2) Mine the mining job (change the nonce until you find a hash matching the block difficulty).
// 3) Submit the mined job to the Node in order to build the next block in the chain.
//
// Reference: Miner/research/3_practical-project-implement-miner.pdf file
async function infiniteMining() {
	console.log();
	console.log('Begin Infinite Mining...');

	let getMiningJobRestfulUrl = `${nodeUrl}/mining/get-mining-job/${minerPublicAddress}`;
	// console.log('getMiningJobRestfulUrl -->', getMiningJobRestfulUrl);

	let submitMinedJobRestfulUrl = `${nodeUrl}/mining/submit-mined-block`;
	// console.log('submitMinedJobRestfulUrl -->', submitMinedJobRestfulUrl);

	while (true) {
		console.log();

		// Take a mining job from the Node through it's REST API.
		console.log('Take a mining job from the Node through its REST API.');
		console.log('   GET RESTFul URL -->', getMiningJobRestfulUrl);
		let getMiningJobSuccessfulResponse = undefined;
		let getMiningJobErrorResponse = undefined;
		await axios.get(getMiningJobRestfulUrl, {timeout: restfulCallTimeout})
			.then(function (response) {
				// console.log('response = ', response);
				// console.log('response.data =', response.data);
				// console.log('response.status =', response.status);
				// console.log('response.statusText =', response.statusText);
				// console.log('response.headers =', response.headers);
				// console.log('response.config =', response.config);

				getMiningJobSuccessfulResponse = response.data;
			})
			.catch(function (error) {
				// console.log('error =', error);
				getMiningJobErrorResponse = error;
		});

		// console.log('getMiningJobSuccessfulResponse =', getMiningJobSuccessfulResponse);
		// console.log('getMiningJobErrorResponse =', getMiningJobErrorResponse);

		// Check the Response from the GET /mining/get-mining-job/${minerPublicAddress} RESTFul Call.
		if (getMiningJobSuccessfulResponse === undefined && getMiningJobErrorResponse === undefined) {
			console.log(`Node ${nodeUrl} did not respond after timeout period from GET RESTFul call to ${getMiningJobRestfulUrl}`);
			console.log('   Stopping the Miner....');
			break;
		}
		else if (getMiningJobErrorResponse !== undefined) {
			console.log(`Error shown below occurred when GET RESTFul call to ${getMiningJobRestfulUrl} made:`);
			console.log(getMiningJobErrorResponse);
			console.log();
			console.log('Stopping the Miner....');
			break;
		}

		// At this point, we know that "getMiningJobSuccessfulResponse" is defined
		console.log('getMiningJobSuccessfulResponse =', getMiningJobSuccessfulResponse);

		console.log();

		// Mine the mining job (change the nonce until you find a hash matching the block difficulty)
		console.log('Mine the mining job (change the nonce until you find a hash matching the block difficulty)')

		let blockToBeMined = {
				dateCreated: new Date().toISOString(),
				nonce: 0,
				difficulty: getMiningJobSuccessfulResponse.difficulty,
				blockDataHash: getMiningJobSuccessfulResponse.blockDataHash,
				blockHash: undefined
		};

		let leadingZeros = ''.padStart(blockToBeMined.difficulty, '0');
		let timeToFindNonce = 60000; // time in milliseconds
		let startTimeForNonce = new Date().getTime();
		while (true) {
			// blockToBeMined.dateCreated = new Date().toISOString();
			blockToBeMined.blockHash = calculateBlockHash(blockToBeMined);
			if (blockToBeMined.blockHash.startsWith(leadingZeros)) {
				break;
			}
			blockToBeMined.nonce++;

			let timeDifference = new Date().getTime() - startTimeForNonce;
			if (timeDifference > timeToFindNonce) {
				console.log(`Time period to find nonce exceeded the ${timeToFindNonce} milliseconds - will just stop and just get another block to mine.`);
				blockToBeMined = undefined;
				break;
			}
		}
		if (blockToBeMined === undefined) {
			continue;
		}

		console.log('Block Mined =', blockToBeMined);

		console.log();

		// Submit the mined job to the Node in order to build the next block in the chain.

		console.log('Submit the mined job to the Node in order to build the next block in the chain.');
		console.log('   POST RESTFul URL -->', submitMinedJobRestfulUrl);

		let submitMinedJobSuccessfulResponse = undefined;
		let submitMinedJobErrorResponse = undefined;
		let submitMinedJobJsonInput = {
				blockDataHash: blockToBeMined.blockDataHash,
				dateCreated: blockToBeMined.dateCreated,
				nonce: blockToBeMined.nonce,
				blockHash: blockToBeMined.blockHash
		}
		await axios.post(submitMinedJobRestfulUrl, submitMinedJobJsonInput, {timeout: restfulCallTimeout})
			.then(function (response) {
				// console.log('response = ', response);
				// console.log('response.data =', response.data);
				// console.log('response.status =', response.status);
				// console.log('response.statusText =', response.statusText);
				// console.log('response.headers =', response.headers);
				// console.log('response.config =', response.config);

				submitMinedJobSuccessfulResponse = response.data;
			})
			.catch(function (error) {
				// console.log('error =', error);
				submitMinedJobErrorResponse = error;
		});

		// Check the Response from the POST /mining/submit-mined-block RESTFul Call.
		if (submitMinedJobSuccessfulResponse === undefined && submitMinedJobErrorResponse === undefined) {
			console.log(`Node ${nodeUrl} did not respond after timeout period from POST RESTFul call to ${submitMinedJobRestfulUrl}`);
			console.log('   Stopping the Miner....');
			break;
		}
		else if (submitMinedJobErrorResponse !== undefined) {
			console.log(`Error shown below occurred when POST RESTFul call to ${submitMinedJobRestfulUrl} made:`);
			console.log(submitMinedJobErrorResponse);
			console.log();
			console.log('Although Error returned no need to stop the Miner, because perhaps soome other Miner was able to mine the block first...');

			if (submitMinedJobErrorResponse.response !== undefined) {
				if (submitMinedJobErrorResponse.response.status !== undefined) {
					console.log('submitMinedJobErrorResponse.response.status =', submitMinedJobErrorResponse.response.status);
				}

				if (submitMinedJobErrorResponse.response.statusText !== undefined) {
					console.log('submitMinedJobErrorResponse.response.statusText =', submitMinedJobErrorResponse.response.statusText);
				}

				if (submitMinedJobErrorResponse.response.data !== undefined) {
					console.log('submitMinedJobErrorResponse.response.data =', submitMinedJobErrorResponse.response.data);
				}
			}
		}
		else { // At this point, we know that "submitMinedJobSuccessfulResponse" is defined
			console.log('submitMinedJobSuccessfulResponse =', submitMinedJobSuccessfulResponse);
		}

		if (mineOnlyOnce) {
			break;
		}

	} // end while loop

	console.log();
	console.log('Ended Infinite Mining...');
	console.log();
}

infiniteMining();
