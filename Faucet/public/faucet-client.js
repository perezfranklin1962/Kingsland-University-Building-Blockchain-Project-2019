$(document).ready(function () {
	// As per Patrick Galloway:
	// 1) If there is an error in communications, or if the peer takes longer than 60 seconds to respond, the peer should be dropped.
	// 2) If I call a peer with ANY RESTFul Web Service and I get back an error or there's no response in 60 seconds, I will drop the peer.
	//
	// References:
	// 1) Node/research/Patrick-Galloway_What-to-do-if-Peer-does=not-respond-or-errors-out.jpg file
	// 2) https://medium.com/@masnun/handling-timeout-in-axios-479269d83c68
	var restfulCallTimeout = 60000; // 60 seconds or 60000 milliseconds

	// This is a Map that that keeps track of the time/date that any Public Address has received Coins from the Faucet.
	// The "key" will be a Public Address and the "value" will be the time in milliseconds since the UNIX Epoch Time (1/1/1970).
	// In JavaScript, a timestamp is the number of milliseconds that have passed since January 1, 1970.
	// A Public Address will be permitted to receive Coins from the faucet only within an hour time frame. In other words,
	// only ONE one request per address per hour will be permitted.
	var previousTimePublicAddressReceivedCoinsFromFaucet = new Map();

    showView("viewHome");

    $('#linkHome').click(function () {
		console.log('linkHome clicked');
        showView("viewHome");
    });

    $('#linkFaucet').click(function () {
		console.log('linkFaucet clicked');

		let feeAmountToSend = $('#feeAmountToSend').val();
		if (feeAmountToSend.length === 0) {
			$('#feeAmountToSend').val('10');
		}
		else if (isNumeric(feeAmountToSend)) {
			feeAmountToSend = parseInt(feeAmountToSend);
			if (feeAmountToSend < 10) {
				$('#feeAmountToSend').val('10');
			}
		}
		else {
			$('#feeAmountToSend').val('10');
		}

        showView("viewFaucet");
    });

    $('#buttonGetYourCoins').click(getYourCoins);
    $('#buttonClearFaucet').click(clearFaucet);

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

    async function getYourCoins() {
		let recipientPublicAddress = $('#recipientPublicAddress').val().trim().toLowerCase();
		if (recipientPublicAddress.length === 0) {
			showError('The Recipient Public Address cannot be an empty string or consist only of white space. Please enter a ' +
				'Recipient Public Address value that is a 40-hex lowercase string.');
			return;
		}
		if (!isValidPublicAddress(recipientPublicAddress)) {
			showError("Entered Recipient Public Address is not a 40-hex valued lower case string. " +
				"Please enter a Recipient Public Address that is a 40-hex valued lower case string.");
			return;
		}

		if (previousTimePublicAddressReceivedCoinsFromFaucet.has(recipientPublicAddress)) {
			let dateTimePublicAddressReceivedCoins = previousTimePublicAddressReceivedCoinsFromFaucet.get(recipientPublicAddress);
			let nowDateTime = new Date().getTime();

			// An hour is a unit of time equal to 60 minutes, or 3,600 seconds.
			// Source --> https://www.calculateme.com/time/hours/to-milliseconds/
			let oneHourInMilliseconds = 3600000;

			let deltaTime = Math.abs(nowDateTime - dateTimePublicAddressReceivedCoins);
			if (deltaTime <= oneHourInMilliseconds) {
				showError('Entered Recipient Public Address has already received Coins within the last hour. Only ' +
					'ONE one request per Public Address per hour will be permitted.');
				return;
			}
		}

		// Check for validity of the Value to Send.
		let amountToSendValue = $('#valueAmountToSend').val().trim();
		if (amountToSendValue.length === 0) {
			showError('Value to send cannot be an empty string or consist only of white space. Please enter a ' +
				'Value to send that is a positive integer.');
			return;
		}
		if (!isNumeric(amountToSendValue)) {
			showError("Entered Value to send is not a positive integer. " +
					"Please enter a Value to send that is positive integer.");
			return;
		}
		amountToSendValue = parseInt(amountToSendValue);

		// Check that the recipient is not asking for more than 1,000,000 micro-coins.
		if (amountToSendValue > 1000000) {
			showError("Entered Value to send is greater than 1,000,000 micro-coins. " +
					  "Please enter a Value to send that is positive integer and less than 1,000,000 micro-coins.");
			return;
		}

		// Check for validity of the Fee.
		let feeAmount = $('#feeAmountToSend').val().trim();
		if (feeAmount.length === 0) {
			showError('Fee cannot be an empty string or consist only of white space. Please enter a ' +
					  'Fee that is a positive integer greater than or equal to 10.');
			return;
		}
		if (!isNumeric(feeAmount)) {
			showError("Entered Fee is not a positive integer. " +
				"Please enter a Fee that is positive integer greater than or equal to 10.");
			return;
		}

		feeAmount = parseInt(feeAmount);
		/*
		if (feeAmount < 10) {
			showError("Entered Fee is not a positive integer greater than or equal to 10. " +
				"Please enter a Fee that is positive integer greater than or equal to 10.");
			return;
		}
		*/

		if (amountToSendValue <= feeAmount) {
			showError("Entered Value is less than or equal to the Fee. " +
					  "Please enter Value that is greater than the Fee.");
			return;
		}

		// Validate the Chain Node URL entered.
		let nodeIdUrl = $('#blockchainNodeFaucet').val().trim();
		if (nodeIdUrl.length === 0) {
			showError('The Blockchain Node cannot be an empty string or consist only of white space. Please enter a ' +
				'Blockchain Node value that has an URL format such as http://localhost:5555 or ' +
				'https:/stormy-everglades-34766.herokuapp.com:5555');
			return;
		}
		if (!isValidURL(nodeIdUrl)) {
			showError('The entered Blockchain Node is not an URL formatted string. Please enter a ' +
				'Blockchain Node value that has an URL format such as http://localhost:5555 or ' +
				'https:/stormy-everglades-34766.herokuapp.com:5555');
			return;
		}

		let getCoinsJsonInput = {
				'recipientPublicAddress': recipientPublicAddress,
				'amountToSendValue': amountToSendValue - feeAmount,
				'feeAmountToSend': feeAmount,
				'blockchainNodeFaucet': nodeIdUrl
		};

		console.log('getCoinsJsonInput = ', getCoinsJsonInput);

		// Since we are at the server already, then do not use http://localhost:7777 or else it will not work.
		// let restfulUrl = "http://localhost:7777/getCoins";
		let restfulUrl = "/getCoins";
		let restfulSuccessfulResponse = undefined;
		let restfulErrorResponse = undefined;

		showInfo(`Waiting for response from Blockchain Node ${nodeIdUrl} ....`);

		await axios.post(restfulUrl, getCoinsJsonInput, {timeout: restfulCallTimeout})
			.then(response => {
				// console.log('response = ', response);
				// console.log('response.data =', response.data);
				// console.log('response.status =', response.status);
				// console.log('response.statusText =', response.statusText);
				// console.log('response.headers =', response.headers);
				// console.log('response.config =', response.config);
				restfulSuccessfulResponse = response.data;
				console.log('axios_post_then response =', response);
				console.log('axios_post_then response.data =', response.data);
			})
			.catch(function (error) {
				// console.log('error =', JSON.stringify(error, undefined, 2));
				// console.log('error.response =', error.response);

				// When in browser, to get the response body, you must get it from the "error.response" or else
				// you will not be able to get it outside of here.
				//
				// Reference ---> https://github.com/axios/axios/issues/960
				if (error.response === undefined) {
					restfulErrorResponse = error;
				}
				else {
					restfulErrorResponse = error.response;
				}
  			});

  		hideInfo();

   		let errorMessage = undefined;
   		let displaySendTransactionInfo = undefined;

 		// If the RESTFul call to Blockchain Node yielded no response after the timeout, then just display an error message.
 		if (restfulSuccessfulResponse === undefined && restfulErrorResponse === undefined) {
 			errorMessage = `Attempt to call ${restfulUrl} to send transaction failed due to timeout - unable to ` +
 				`send the transaction.`
 			showError(errorMessage);
 		}
 		else if (restfulErrorResponse !== undefined) {
 			errorMessage = `Attempt to call ${restfulUrl } to send transaction failed due to error encountered - unable to ` +
 				`send the transaction. See details of error in text area under the 'Results:' label.`;
 			showError(errorMessage);

 			// Technique to prettify obtained from the https://coderwall.com/p/buwfjw/pretty-print-json-with-native-javascript
 			// web page.
 			displaySendTransactionInfo = JSON.stringify(restfulErrorResponse, undefined, 2);

 			console.log('restfulErrorResponse =', restfulErrorResponse);

 			if (restfulErrorResponse.data !== undefined) {
 				displaySendTransactionInfo = "Error Status: " + restfulErrorResponse.status + "\n" +
 					"Error Status Description: " + restfulErrorResponse.statusText + "\n\n" +
 					"Error Message Details: \n";

 				console.log('getYourCoins restfulErrorResponse.data =', restfulErrorResponse.data);

 				if (restfulErrorResponse.data.errorMsg !== undefined) {
					console.log('getYourCoins restfulErrorResponse.data.errorMsg =', restfulErrorResponse.data.errorMsg);
 					displaySendTransactionInfo += restfulErrorResponse.data.errorMsg + "\n\n\n";
 					console.log('getYourCoins restfulErrorResponse.data.displaySendTransactionInfo =', restfulErrorResponse.data.displaySendTransactionInfo);
 					if (restfulErrorResponse.data.displaySendTransactionInfo !== undefined) {
						displaySendTransactionInfo += restfulErrorResponse.data.displaySendTransactionInfo;
					}
 				}
 				else {
 					displaySendTransactionInfo += JSON.stringify(restfulErrorResponse.data, undefined, 2);
 				}
 			}

 			$('#textareaSendTransactionResult').val(displaySendTransactionInfo);
 		}
 		else { // restfulSuccessfulResponse !== undefined
 			console.log('restfulSuccessfulResponse =', restfulSuccessfulResponse);

 			previousTimePublicAddressReceivedCoinsFromFaucet.set(recipientPublicAddress, new Date().getTime());

 			// let displaySendTransactionInfoJson = JSON.parse(restfulSuccessfulResponse);
 			let displaySendTransactionInfo = "Successful Faucet Operation: \n" +
 					`We sent ${amountToSendValue - feeAmount} micro-coins to public address ${recipientPublicAddress}` + "\n\n" +
 					restfulSuccessfulResponse.message;

 			$('#textareaSendTransactionResult').val(displaySendTransactionInfo);
		}
    }

    function clearFaucet() {
		$('#recipientPublicAddress').val('');
		$('#valueAmountToSend').val('');
		$('#feeAmountToSend').val('10');
		$('#blockchainNodeFaucet').val('');
		$('#textareaSendTransactionResult').val('');
	}

});