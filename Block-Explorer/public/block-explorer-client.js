$(document).ready(function () {
	// As per Patrick Galloway:
	// 1) If there is an error in communications, or if the peer takes longer than 60 seconds to respond, the peer should be dropped.
	// 2) If I call a peer with ANY RESTFul Web Service and I get back an error or there's no response in 60 seconds, I will drop the peer.
	//
	// References:
	// 1) Node/research/Patrick-Galloway_What-to-do-if-Peer-does=not-respond-or-errors-out.jpg file
	// 2) https://medium.com/@masnun/handling-timeout-in-axios-479269d83c68
	var restfulCallTimeout = 60000; // 60 seconds or 60000 milliseconds

	// Used to keep track of the current peers;
	var currentPeersMap = new Map();

	// Used to keep track of the Blocks that are currently being shown under "View Block(s) Results"
	var currentBlocks = [];
	var maximumNumberOfBlocksToView = 50;

	// Used to keep track of the Transactions in a specific chosen Block under "View Transaction(s) Results"
	var transactionsInBlock = [];

    showView("viewHome");

    $('#linkHome').click(function () {
		console.log('linkHome clicked');
        showView("viewHome");
    });

    $('#linkViewGeneralInfo').click(function () {
		console.log('linkViewGeneralInfo clicked');
	    showView("viewGeneralInfo");
    });

    $('#linkViewPeers').click(function () {
		console.log('linkViewPeers clicked');
		createViewPeersTable();
	    showView("viewPeers");
    });

    $('#linkViewBlocks').click(function () {
		console.log('linkViewBlocks clicked');
		createViewBlocksResultsTable();
		createViewTransactionsResultsTable();
	    showView("viewBlocks");
    });

    // $('#buttonGetYourCoins').click(getYourCoins);
    // $('#buttonClearFaucet').click(clearFaucet);

    $('#buttonGetGeneralInfo').click(getGeneralInfo);
    $('#buttonClearGeneralInfoResults').click(clearGeneralInfoResults);

    $('#buttonGetPeers').click(getPeers);
    $('#buttonClearPeersResults').click(clearPeersResults);

    $('#buttonShowLatestBlocks').click(showLatestBlocks);
    $('#buttonViewBlocksTableClearResults').click(viewBlocksTableClearResults);
    $('#buttonShowBlocksRangeAscendingOrder').click(showBlocksRangeAscendingOrder);
    $('#buttonShowBlocksRangeDescendingOrder').click(showBlocksRangeDescendingOrder);
    $('#buttonClearViewRangeOfBlocksInputs').click(clearViewRangeOfBlocksInputs);
    $('#buttonShowBlockByBlockIndexNumberViewBlocks').click(showBlockByBlockIndexNumberViewBlocks);
    $('#buttonClearBlockIndexNumberInput').click(clearBlockIndexNumberInput);

    $('#buttonShowAllTransactionsInSpecifiedBlockViewBlocks').click(showAllTransactionsInSpecifiedBlock);
    $('#buttonClearBlockIndexNumberViewAllTransactionsInBlockInput').click(clearBlockIndexNumberViewAllTransactionsInBlockInput);
    $('#buttonClearViewTransactionsResultsBlocksView').click(clearViewTransactionsResultsBlocksView);

    function showView(viewName) {
        // Hide all views and show the selected view only
        $('main > section').hide();
        $('#' + viewName).show();
    }

    function showInfo(message) {
        $('#infoBox>p').html(message);
        $('#infoBox').show();
        $('#infoBox>header').click(function () {
            $('#infoBox').hide();
        });
    }

    function hideInfo() {
		$('#infoBox').hide();
	}

    function showError(errorMsg, err) {
        let msgDetails = "";
        if (err && err.responseJSON)
            msgDetails = err.responseJSON.errorMsg;
        $('#errorBox>p').html('Error: ' + errorMsg + msgDetails);
        $('#errorBox').show();
        $('#errorBox>header').click(function () {
            $('#errorBox').hide();
        });
    }

    function getValidChainNodeUrl(nodeIdUrl) {
		if (nodeIdUrl.length === 0) {
			showError('The Blockchain Node cannot be an empty string or consist only of white space. Please enter a ' +
				'Blockchain Node value that has an URL format such as http://localhost:5555 or ' +
				'https:/stormy-everglades-34766.herokuapp.com:5555');
			return undefined;
		}
		if (!isValidURL(nodeIdUrl)) {
			showError('The entered Blockchain Node is not an URL formatted string. Please enter a ' +
				'Blockchain Node value that has an URL format such as http://localhost:5555 or ' +
				'https:/stormy-everglades-34766.herokuapp.com:5555');
			return undefined;
		}

		return nodeIdUrl;
	}

    async function getGeneralInfo() {
		let nodeIdUrl = getValidChainNodeUrl($('#blockchainNodeGeneralInfo').val().trim());
		if (nodeIdUrl === undefined) {
			return;
		}

		showInfo(`Waiting for response from Blockchain Node ${nodeIdUrl} ....`);

		let restfulUrl = nodeIdUrl + "/info";
		let responseData = undefined;
		await axios.get(restfulUrl, {timeout: restfulCallTimeout})
			.then(function (response) {
				// console.log('response = ', response);
				// console.log('response.data =', response.data);
				// console.log('response.status =', response.status);
				// console.log('response.statusText =', response.statusText);
				// console.log('response.headers =', response.headers);
				// console.log('response.config =', response.config);

				responseData = response.data;
			})
			.catch(function (error) {
				// console.log('error =', error);
  		});

  		hideInfo();

  		// console.log('responseData =', responseData);

  		// If we cannot get the "/info" from the given "nodeIdUrl", then...
  		if (responseData === undefined) {
			showError(`RESTFul GET call to ${restfulUrl} did not return back a successful response. ` +
				`Unable to connect to Blockchain Node ID URL: ${nodeIdUrl} - probably invalid Blockchain Node ID URL ` +
				`provided that's not in the network.`);
			return;
		}

		// It's safe to assume at this point that the JSON response will have all the expected data members.
		$('#currentDifficultyGeneralInfoResults').val(responseData.currentDifficulty);
		$('#cumulativeDifficultyGeneralInfoResults').val(responseData.cumulativeDifficulty);
		$('#aboutGeneralInfoResults').val(responseData.about);
		$('#nodeIdGeneralInfoResults').val(responseData.nodeId);
		$('#chainIdGeneralInfoResults').val(responseData.chainId);
		$('#nodeUrlGeneralInfoResults').val(responseData.nodeUrl);
		$('#numberOfPeersGeneralInfoResults').val(responseData.peers);
		$('#numberOfBlocksGeneralInfoResults').val(responseData.blocksCount);
		$('#numberOfConfirmedTransactionsGeneralInfoResults').val(responseData.confirmedTransactions);
		$('#numberOfPendingTransactionsGeneralInfoResults').val(responseData.pendingTransactions);
	}

	function clearGeneralInfoResults() {
		$('#currentDifficultyGeneralInfoResults').val('');
		$('#cumulativeDifficultyGeneralInfoResults').val('');
		$('#aboutGeneralInfoResults').val('');
		$('#nodeIdGeneralInfoResults').val('');
		$('#chainIdGeneralInfoResults').val('');
		$('#nodeUrlGeneralInfoResults').val('');
		$('#numberOfPeersGeneralInfoResults').val('');
		$('#numberOfBlocksGeneralInfoResults').val('');
		$('#numberOfConfirmedTransactionsGeneralInfoResults').val('');
		$('#numberOfPendingTransactionsGeneralInfoResults').val('');
	}

	function createViewPeersTable() {
		let keys = Array.from(currentPeersMap.keys()); // array of keys
        var number_of_rows = keys.length;
        var number_of_cols = 2;

        var table_body = '<table style="width:100%">';
        table_body += '<tr>';
		table_body += '<th>Node ID</th>';
		table_body += '<th>Node URL</th>';
  		table_body += '</tr>';

        for (var i = 0 ; i < number_of_rows; i++) {
			table_body += '<tr>';
            for (var j = 0; j < number_of_cols; j++) {
            	table_body += '<td>';

                let table_data = '';
                if (j == 0) {
					table_data += keys[i];
				}
				else {
					table_data += currentPeersMap.get(keys[i]);
				}

                table_body += table_data;
                table_body += '</td>';
             }

             table_body += '</tr>';
        }

        table_body+='</table>';
        $('#peersViewTableResultsDiv').html(table_body);
	}

	function clearPeersResults() {
		currentPeersMap = new Map();
		createViewPeersTable();
		$('#numberOfPeersViewPeersResults').val('');
	}

	async function getPeers() {
		let nodeIdUrl = getValidChainNodeUrl($('#blockchainNodePeers').val().trim());
		if (nodeIdUrl === undefined) {
			return;
		}

		showInfo(`Waiting for response from Blockchain Node ${nodeIdUrl} ....`);

		let restfulUrl = nodeIdUrl + "/peers";
		let responseData = undefined;
		await axios.get(restfulUrl, {timeout: restfulCallTimeout})
			.then(function (response) {
				// console.log('response = ', response);
				// console.log('response.data =', response.data);
				// console.log('response.status =', response.status);
				// console.log('response.statusText =', response.statusText);
				// console.log('response.headers =', response.headers);
				// console.log('response.config =', response.config);

				responseData = response.data;
			})
			.catch(function (error) {
				// console.log('error =', error);
  		});

  		hideInfo();

  		// console.log('responseData =', responseData);

  		// If we cannot get the "/info" from the given "nodeIdUrl", then...
  		if (responseData === undefined) {
			showError(`RESTFul GET call to ${restfulUrl} did not return back a successful response. ` +
				`Unable to connect to Blockchain Node ID URL: ${nodeIdUrl} - probably invalid Blockchain Node ID URL ` +
				`provided that's not in the network.`);
			return;
		}

		// It's safe to assume at this point that the JSON response will have all the expected data members.
		currentPeersMap = objToStrMap(responseData); // returns a Map
		$('#numberOfPeersViewPeersResults').val(currentPeersMap.size.toString(10));
		createViewPeersTable();
	}

	function createViewBlocksResultsTable() {
        var number_of_rows = currentBlocks.length;
        var number_of_cols = 9;

        var table_body = '<table style="width:100%">';
        table_body += '<tr>';
		table_body += '<th>Index</th>';
		table_body += '<th>Transactions</th>';
		table_body += '<th>Difficulty</th>';
		table_body += '<th>Previous Block Hash</th>';
		table_body += '<th>Mined By</th>';
		table_body += '<th>Block Data Hash</th>';
		table_body += '<th>Nonce</th>';
		table_body += '<th>Date Created</th>';
		table_body += '<th>Block Hash</th>';
  		table_body += '</tr>';

        for (var i = 0 ; i < number_of_rows; i++) {
			table_body += '<tr>';
            for (var j = 0; j < number_of_cols; j++) {
            	table_body += '<td>';

				let rowData = currentBlocks[i];
                let table_data = '';
                if (j === 0) {
					table_data += rowData.index;
				}
				else if (j === 1) {
					table_data += rowData.transactions.length;
				}
				else if (j === 2) {
					table_data += rowData.difficulty;
				}
				else if (j === 3) {
					table_data += rowData.prevBlockHash;
				}
				else if (j === 4) {
					table_data += rowData.minedBy;
				}
				else if (j === 5) {
					table_data += rowData.blockDataHash;
				}
				else if (j === 6) {
					table_data += rowData.nonce;
				}
				else if (j === 7) {
					table_data += rowData.dateCreated;
				}
				else if (j === 8) {
					table_data += rowData.blockHash;
				}

                table_body += table_data;
                table_body += '</td>';
             }

             table_body += '</tr>';
        }

        table_body += '</table>';
        $('#viewBlocksTableResultsDiv').html(table_body);
	}

	function createViewTransactionsResultsTable() {
        var number_of_rows = transactionsInBlock.length;
        var number_of_cols = 12;

        var table_body = '<table style="width:100%">';
        table_body += '<tr>';
		table_body += '<th>From</th>';
		table_body += '<th>To</th>';
		table_body += '<th>Value</th>';
		table_body += '<th>Fee</th>';
		table_body += '<th>Date Created</th>';
		table_body += '<th>Data</th>';
		table_body += '<th>Sender Public Key</th>';
		table_body += '<th>Transaction Data Hash</th>';
		table_body += '<th>Sender Signature (r)</th>';
		table_body += '<th>Sender Signature (s)</th>';
		table_body += '<th>Mined in Block Index</th>';
		table_body += '<th>Transfer Successful</th>';
  		table_body += '</tr>';

        for (var i = 0 ; i < number_of_rows; i++) {
			table_body += '<tr>';
            for (var j = 0; j < number_of_cols; j++) {
            	table_body += '<td>';

				let rowData = transactionsInBlock[i];
                let table_data = '';
                if (j === 0) {
					table_data += rowData.from;
				}
				else if (j === 1) {
					table_data += rowData.to;
				}
				else if (j === 2) {
					table_data += rowData.value;
				}
				else if (j === 3) {
					table_data += rowData.fee;
				}
				else if (j === 4) {
					table_data += rowData.dateCreated;
				}
				else if (j === 5) {
					table_data += rowData.data;
				}
				else if (j === 6) {
					table_data += rowData.senderPubKey;
				}
				else if (j === 7) {
					table_data += rowData.transactionDataHash;
				}
				else if (j === 8) {
					table_data += rowData.senderSignature[0];
				}
				else if (j === 9) {
					table_data += rowData.senderSignature[1];
				}
				else if (j === 10) {
					table_data += rowData.minedInBlockIndex;
				}
				else if (j === 11) {
					table_data += rowData.transferSuccessful;
				}

                table_body += table_data;
                table_body += '</td>';
             }

             table_body += '</tr>';
        }

        table_body += '</table>';
        $('#viewAllTransactionsInBlockTableResultsDiv').html(table_body);
	}

	async function showLatestBlocks() {
		let nodeIdUrl = getValidChainNodeUrl($('#blockchainNodeViewBlocks').val().trim());
		if (nodeIdUrl === undefined) {
			return;
		}

		showInfo(`Waiting for response from Blockchain Node ${nodeIdUrl} ....`);

		let restfulUrl = nodeIdUrl + "/blocks";
		let responseData = undefined;
		await axios.get(restfulUrl, {timeout: restfulCallTimeout})
			.then(function (response) {
				// console.log('response = ', response);
				// console.log('response.data =', response.data);
				// console.log('response.status =', response.status);
				// console.log('response.statusText =', response.statusText);
				// console.log('response.headers =', response.headers);
				// console.log('response.config =', response.config);

				responseData = response.data;
			})
			.catch(function (error) {
				// console.log('error =', error);
  		});

  		hideInfo();

  		// console.log('responseData =', responseData);

  		// If we cannot get the "/blocks" from the given "nodeIdUrl", then...
  		if (responseData === undefined) {
			showError(`RESTFul GET call to ${restfulUrl} did not return back a successful response. ` +
				`Unable to connect to Blockchain Node ID URL: ${nodeIdUrl} - probably invalid Blockchain Node ID URL ` +
				`provided that's not in the network.`);
			return;
		}

		// It's safe to assume at this point that the JSON response will have all the expected data members. Will get back
		// an array of Blocks strating at index 0.

		currentBlocks = [];

		let blockIndex = responseData.length - 1;
		for (let i = 0; i < maximumNumberOfBlocksToView; i++) {
			if (blockIndex < 0) {
				break;
			}

			currentBlocks.push(responseData[blockIndex]);
			blockIndex--;
		}

		createViewBlocksResultsTable();
		$('#totalNumberOfBlocksViewRangeOfBlocksResults').val(responseData.length.toString(10));
		$('#numberOfBlocksShownViewRangeOfBlocksResults').val(currentBlocks.length.toString(10));

		$('#totalNumberOfBlocksViewBlocksDiv').show();
	}

	function clearViewRangeOfBlocksInputs() {
		$('#startBlockIndexNumberViewBlocks').val('');
		$('#endBlockIndexNumberViewBlocks').val('');
	}

	async function showBlocksRangeAscendingOrder() {
		let nodeIdUrl = getValidChainNodeUrl($('#blockchainNodeViewBlocks').val().trim());
		if (nodeIdUrl === undefined) {
			return;
		}

		// Check for valid Start Block Index Number
		let startBlockIndexNumber = $('#startBlockIndexNumberViewBlocks').val().trim();
		if (startBlockIndexNumber.length === 0) {
			showError('Start Block Index Number cannot be an empty string or consist only of white space. Please enter a ' +
				'Start Block Index Number that is an integer greater than or equal to 0.');
			return;
		}
		if (!isNumeric(startBlockIndexNumber)) {
			showError("Entered Start Block Index Number is not a positive integer. " +
					"Please enter a Start Block Index Number that is greater than or equal to 0.");
			return;
		}

		startBlockIndexNumber = parseInt(startBlockIndexNumber);

		// Check for valid End Block Index Number
		let endBlockIndexNumber = $('#endBlockIndexNumberViewBlocks').val().trim();
		if (endBlockIndexNumber.length === 0) {
			showError('End Block Index Number cannot be an empty string or consist only of white space. Please enter an ' +
				'End Block Index Number that is an integer greater than or equal to 0.');
			return;
		}
		if (!isNumeric(endBlockIndexNumber)) {
			showError('Entered End Block Index Number is not a positive integer. ' +
				'Please enter an End Block Index Number that is greater than or equal to 0.');
			return;
		}

		endBlockIndexNumber = parseInt(endBlockIndexNumber);

		// End Block Index Number cannot be less than the Start Block Index Number.
		if (endBlockIndexNumber < startBlockIndexNumber) {
			showError('End Block Index Number is less than Start Block Index Number. Please enter an End Block Index Number that is ' +
				'greater than or equal to the Start Block Index Number.');
			return;
		}

		// Cannot request a Block range of more than 50 blocks.
		let numberOfBlocksRequestedToView = endBlockIndexNumber - startBlockIndexNumber + 1;
		if (numberOfBlocksRequestedToView > maximumNumberOfBlocksToView) {
			showError(`Requested Range of Blocks to view (${numberOfBlocksRequestedToView}) is greater than the ${maximumNumberOfBlocksToView} allowed. ` +
				`Please specify a Block Range to view that is less than or equal to ${maximumNumberOfBlocksToView} blocks.`);
			return;
		}

		showInfo(`Waiting for response from Blockchain Node ${nodeIdUrl} ....`);

		let restfulUrl = nodeIdUrl + "/blocks";
		let responseData = undefined;
		await axios.get(restfulUrl, {timeout: restfulCallTimeout})
			.then(function (response) {
				// console.log('response = ', response);
				// console.log('response.data =', response.data);
				// console.log('response.status =', response.status);
				// console.log('response.statusText =', response.statusText);
				// console.log('response.headers =', response.headers);
				// console.log('response.config =', response.config);

				responseData = response.data;
			})
			.catch(function (error) {
				// console.log('error =', error);
  		});

  		hideInfo();

  		// console.log('responseData =', responseData);

  		// If we cannot get the "/blocks" from the given "nodeIdUrl", then...
  		if (responseData === undefined) {
			showError(`RESTFul GET call to ${restfulUrl} did not return back a successful response. ` +
				`Unable to connect to Blockchain Node ID URL: ${nodeIdUrl} - probably invalid Blockchain Node ID URL ` +
				`provided that's not in the network.`);
			return;
		}

		// It's safe to assume at this point that the JSON response will have all the expected data members. Will get back
		// an array of Blocks starting at index 0.

		// Check that the Start Block Index Number and End Block Index Number refers to existing blocks in the Chain.
		let totalNumberOfBlocksInBlockchain = responseData.length;
		if (startBlockIndexNumber >= totalNumberOfBlocksInBlockchain) {
			showError(`Entered Start Block Index Number refers to a Block Number that does not exist in the Chain. ` +
				`The current number of blocks in the Chain is ${totalNumberOfBlocksInBlockchain}. ` +
				`Please enter a Start Block Index Number that is less than ${totalNumberOfBlocksInBlockchain}.`);
			return;
		}
		if (endBlockIndexNumber >= totalNumberOfBlocksInBlockchain) {
			showError(`Entered End Block Index Number refers to a Block Number that does not exist in the Chain. ` +
				`The current number of blocks in the Chain is ${totalNumberOfBlocksInBlockchain}. ` +
				`Please enter an End Block Index Number that is less than ${totalNumberOfBlocksInBlockchain}.`);
			return;
		}

		currentBlocks = [];

		for (let i = startBlockIndexNumber; i <= endBlockIndexNumber; i++) {
			currentBlocks.push(responseData[i]);
		}

		createViewBlocksResultsTable();
		$('#totalNumberOfBlocksViewRangeOfBlocksResults').val(totalNumberOfBlocksInBlockchain.toString(10));
		$('#numberOfBlocksShownViewRangeOfBlocksResults').val(currentBlocks.length.toString(10));

		$('#totalNumberOfBlocksViewBlocksDiv').show();
	}

	async function showBlocksRangeDescendingOrder() {
		let nodeIdUrl = getValidChainNodeUrl($('#blockchainNodeViewBlocks').val().trim());
		if (nodeIdUrl === undefined) {
			return;
		}

		// Check for valid Start Block Index Number
		let startBlockIndexNumber = $('#startBlockIndexNumberViewBlocks').val().trim();
		if (startBlockIndexNumber.length === 0) {
			showError('Start Block Index Number cannot be an empty string or consist only of white space. Please enter a ' +
				'Start Block Index Number that is an integer greater than or equal to 0.');
			return;
		}
		if (!isNumeric(startBlockIndexNumber)) {
			showError("Entered Start Block Index Number is not a positive integer. " +
					"Please enter a Start Block Index Number that is greater than or equal to 0.");
			return;
		}

		startBlockIndexNumber = parseInt(startBlockIndexNumber);

		// Check for valid End Block Index Number
		let endBlockIndexNumber = $('#endBlockIndexNumberViewBlocks').val().trim();
		if (endBlockIndexNumber.length === 0) {
			showError('End Block Index Number cannot be an empty string or consist only of white space. Please enter an ' +
				'End Block Index Number that is an integer greater than or equal to 0.');
			return;
		}
		if (!isNumeric(endBlockIndexNumber)) {
			showError('Entered End Block Index Number is not a positive integer. ' +
				'Please enter an End Block Index Number that is greater than or equal to 0.');
			return;
		}

		endBlockIndexNumber = parseInt(endBlockIndexNumber);

		// End Block Index Number cannot be less than the Start Block Index Number.
		if (endBlockIndexNumber < startBlockIndexNumber) {
			showError('End Block Index Number is less than Start Block Index Number. Please enter an End Block Index Number that is ' +
				'greater than or equal to the Start Block Index Number.');
			return;
		}

		// Cannot request a Block range of more than 50 blocks.
		let numberOfBlocksRequestedToView = endBlockIndexNumber - startBlockIndexNumber + 1;
		if (numberOfBlocksRequestedToView > maximumNumberOfBlocksToView) {
			showError(`Requested Range of Blocks to view (${numberOfBlocksRequestedToView}) is greater than the ${maximumNumberOfBlocksToView} allowed. ` +
				`Please specify a Block Range to view that is less than or equal to ${maximumNumberOfBlocksToView} blocks.`);
			return;
		}

		showInfo(`Waiting for response from Blockchain Node ${nodeIdUrl} ....`);

		let restfulUrl = nodeIdUrl + "/blocks";
		let responseData = undefined;
		await axios.get(restfulUrl, {timeout: restfulCallTimeout})
			.then(function (response) {
				// console.log('response = ', response);
				// console.log('response.data =', response.data);
				// console.log('response.status =', response.status);
				// console.log('response.statusText =', response.statusText);
				// console.log('response.headers =', response.headers);
				// console.log('response.config =', response.config);

				responseData = response.data;
			})
			.catch(function (error) {
				// console.log('error =', error);
  		});

  		hideInfo();

  		// console.log('responseData =', responseData);

  		// If we cannot get the "/blocks" from the given "nodeIdUrl", then...
  		if (responseData === undefined) {
			showError(`RESTFul GET call to ${restfulUrl} did not return back a successful response. ` +
				`Unable to connect to Blockchain Node ID URL: ${nodeIdUrl} - probably invalid Blockchain Node ID URL ` +
				`provided that's not in the network.`);
			return;
		}

		// It's safe to assume at this point that the JSON response will have all the expected data members. Will get back
		// an array of Blocks starting at index 0.

		// Check that the Start Block Index Number and End Block Index Number refers to existing blocks in the Chain.
		let totalNumberOfBlocksInBlockchain = responseData.length;
		if (startBlockIndexNumber >= totalNumberOfBlocksInBlockchain) {
			showError(`Entered Start Block Index Number refers to a Block Number that does not exist in the Chain. ` +
				`The current number of blocks in the Chain is ${totalNumberOfBlocksInBlockchain}. ` +
				`Please enter a Start Block Index Number that is less than ${totalNumberOfBlocksInBlockchain}.`);
			return;
		}
		if (endBlockIndexNumber >= totalNumberOfBlocksInBlockchain) {
			showError(`Entered End Block Index Number refers to a Block Number that does not exist in the Chain. ` +
				`The current number of blocks in the Chain is ${totalNumberOfBlocksInBlockchain}. ` +
				`Please enter an End Block Index Number that is less than ${totalNumberOfBlocksInBlockchain}.`);
			return;
		}

		currentBlocks = [];

		let blockIndexNumber = endBlockIndexNumber;
		for (let i = startBlockIndexNumber; i <= endBlockIndexNumber; i++) {
			currentBlocks.push(responseData[blockIndexNumber]);
			blockIndexNumber--;
		}

		createViewBlocksResultsTable();
		$('#totalNumberOfBlocksViewRangeOfBlocksResults').val(totalNumberOfBlocksInBlockchain.toString(10));
		$('#numberOfBlocksShownViewRangeOfBlocksResults').val(currentBlocks.length.toString(10));

		$('#totalNumberOfBlocksViewBlocksDiv').show();
	}

	async function showBlockByBlockIndexNumberViewBlocks() {
		let nodeIdUrl = getValidChainNodeUrl($('#blockchainNodeViewBlocks').val().trim());
		if (nodeIdUrl === undefined) {
			return;
		}

		// Check for valid Block Index Number
		let blockIndexNumber = $('#blockIndexNumberViewBlocks').val().trim();
		if (blockIndexNumber.length === 0) {
			showError('Block Index Number cannot be an empty string or consist only of white space. Please enter a ' +
				'Block Index Number that is an integer greater than or equal to 0.');
			return;
		}
		if (!isNumeric(blockIndexNumber)) {
			showError("Entered Block Index Number is not a positive integer. " +
					"Please enter Block Index Number that is greater than or equal to 0.");
			return;
		}

		blockIndexNumber = parseInt(blockIndexNumber);

		showInfo(`Waiting for response from Blockchain Node ${nodeIdUrl} ....`);

		let restfulUrl = nodeIdUrl + `/blocks/${blockIndexNumber}`;
		let responseData = undefined;
		let errorResponse = undefined;
		await axios.get(restfulUrl, {timeout: restfulCallTimeout})
			.then(function (response) {
				// console.log('response = ', response);
				// console.log('response.data =', response.data);
				// console.log('response.status =', response.status);
				// console.log('response.statusText =', response.statusText);
				// console.log('response.headers =', response.headers);
				// console.log('response.config =', response.config);

				responseData = response.data;
			})
			.catch(function (error) {
				// console.log('error =', error);
				if (error.response != undefined) {
					errorResponse = error.response;
				}
				else {
					errorResponse = error;
				}
  		});

  		hideInfo();

  		// console.log('responseData =', responseData);
  		console.log('errorResponse =', errorResponse);

  		// If we cannot get the "/blocks" from the given "nodeIdUrl", then...
  		if (responseData === undefined && errorResponse === undefined) {
			showError(`RESTFul GET call to ${restfulUrl} did not return back a successful response. ` +
				`Unable to connect to Blockchain Node ID URL: ${nodeIdUrl} - probably invalid Blockchain Node ID URL ` +
				`provided that's not in the network.`);
			return;
		}
		else if (errorResponse !== undefined) {
			if (errorResponse.data !== undefined && errorResponse.data.errorMsg !== undefined) {
				showError(errorResponse.data.errorMsg);
				return;
			}
			else {
				showError(`RESTFul GET call to ${restfulUrl} did not return back a successful response. ` +
					`Unable to connect to Blockchain Node ID URL: ${nodeIdUrl} - probably invalid Blockchain Node ID URL ` +
					`provided that's not in the network.`);
				return;
			}
		}

		// It's safe to assume at this point that the JSON response will have all the expected data members. Will get back
		// one Block.

		currentBlocks = [ responseData ];

		createViewBlocksResultsTable();
		$('#totalNumberOfBlocksViewRangeOfBlocksResults').val('');
		$('#numberOfBlocksShownViewRangeOfBlocksResults').val('1');

		$('#totalNumberOfBlocksViewBlocksDiv').hide();
	}

	function clearBlockIndexNumberInput() {
		$('#blockIndexNumberViewBlocks').val('');
	}

	async function showAllTransactionsInSpecifiedBlock() {
		let nodeIdUrl = getValidChainNodeUrl($('#blockchainNodeViewBlocks').val().trim());
		if (nodeIdUrl === undefined) {
			return;
		}

		// Check for valid Block Index Number
		let blockIndexNumber = $('#blockIndexNumberViewAllTransactionsInBlock').val().trim();
		if (blockIndexNumber.length === 0) {
			showError('Block Index Number cannot be an empty string or consist only of white space. Please enter a ' +
				'Block Index Number that is an integer greater than or equal to 0.');
			return;
		}
		if (!isNumeric(blockIndexNumber)) {
			showError("Entered Block Index Number is not a positive integer. " +
					"Please enter Block Index Number that is greater than or equal to 0.");
			return;
		}

		blockIndexNumber = parseInt(blockIndexNumber);

		showInfo(`Waiting for response from Blockchain Node ${nodeIdUrl} ....`);

		let restfulUrl = nodeIdUrl + `/blocks/${blockIndexNumber}`;
		let responseData = undefined;
		let errorResponse = undefined;
		await axios.get(restfulUrl, {timeout: restfulCallTimeout})
			.then(function (response) {
				// console.log('response = ', response);
				// console.log('response.data =', response.data);
				// console.log('response.status =', response.status);
				// console.log('response.statusText =', response.statusText);
				// console.log('response.headers =', response.headers);
				// console.log('response.config =', response.config);

				responseData = response.data;
			})
			.catch(function (error) {
				// console.log('error =', error);
				if (error.response != undefined) {
					errorResponse = error.response;
				}
				else {
					errorResponse = error;
				}
  		});

  		hideInfo();

  		// console.log('responseData =', responseData);
  		console.log('errorResponse =', errorResponse);

  		// If we cannot get the "/blocks" from the given "nodeIdUrl", then...
  		if (responseData === undefined && errorResponse === undefined) {
			showError(`RESTFul GET call to ${restfulUrl} did not return back a successful response. ` +
				`Unable to connect to Blockchain Node ID URL: ${nodeIdUrl} - probably invalid Blockchain Node ID URL ` +
				`provided that's not in the network.`);
			return;
		}
		else if (errorResponse !== undefined) {
			if (errorResponse.data !== undefined && errorResponse.data.errorMsg !== undefined) {
				showError(errorResponse.data.errorMsg);
				return;
			}
			else {
				showError(`RESTFul GET call to ${restfulUrl} did not return back a successful response. ` +
					`Unable to connect to Blockchain Node ID URL: ${nodeIdUrl} - probably invalid Blockchain Node ID URL ` +
					`provided that's not in the network.`);
				return;
			}
		}

		// It's safe to assume at this point that the JSON response will have all the expected data members. Will get back
		// one Block.

		transactionsInBlock = responseData.transactions; // array of transactions

		createViewTransactionsResultsTable();
		$('#totalNumberOfTransactionsInBlockResults').val(transactionsInBlock.length.toString(10));
	}

	function clearBlockIndexNumberViewAllTransactionsInBlockInput() {
		$('#blockIndexNumberViewAllTransactionsInBlock').val('');
	}

	function clearViewTransactionsResultsBlocksView() {
		transactionsInBlock = [ ];
		createViewTransactionsResultsTable();
		$('#totalNumberOfTransactionsInBlockResults').val('');
	}

	function viewBlocksTableClearResults() {
		currentBlocks = [];
		createViewBlocksResultsTable();
		$('#totalNumberOfBlocksViewRangeOfBlocksResults').val('');
		$('#numberOfBlocksShownViewRangeOfBlocksResults').val('');

		$('#totalNumberOfBlocksViewBlocksDiv').show();
	}
});