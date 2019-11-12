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
		createViewPeersTable(currentPeersMap);
	    showView("viewPeers");
    });

    $('#linkViewBlocks').click(function () {
		console.log('linkViewBlocks clicked');
	    showView("viewBlocks");
    });

    // $('#buttonGetYourCoins').click(getYourCoins);
    // $('#buttonClearFaucet').click(clearFaucet);

    $('#buttonGetGeneralInfo').click(getGeneralInfo);
    $('#buttonClearGeneralInfoResults').click(clearGeneralInfoResults);

    $('#buttonGetPeers').click(getPeers);
    $('#buttonClearPeersResults').click(clearPeersResults);

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

});