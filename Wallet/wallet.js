$(document).ready(function () {
	// As per Patrick Galloway:
	// 1) If there is an error in communications, or if the peer takes longer than 60 seconds to respond, the peer should be dropped.
	// 2) If I call a peer with ANY RESTFul Web Service and I get back an error or there's no response in 60 seconds, I will drop the peer.
	//
	// References:
	// 1) Node/research/Patrick-Galloway_What-to-do-if-Peer-does=not-respond-or-errors-out.jpg file
	// 2) https://medium.com/@masnun/handling-timeout-in-axios-479269d83c68
	var restfulCallTimeout = 60000; // 60 seconds or 60000 milliseconds

	// The "axios" global variable is obtained from the "<head>" section of the "wallet.html" file that
	// included the https://unpkg.com/axios/dist/axios.min.js file as explained in the comments of the
	// "wallet.html" file.

    showView("viewHome");

    $('#linkHome').click(function () {
		console.log('linkHome clicked');
        showView("viewHome");
    });

    $('#linkCreateNewWallet').click(function () {
		console.log('linkCreateNewWallet clicked');
        $('#textareaCreateWalletResult').val('');
        showView("viewCreateNewWallet");
    });

    $('#linkOpenExistingWallet').click(function () {
		console.log('Clicked on linkOpenExistingWallet');
		console.log('   sessionStorage.privateKey =', sessionStorage.privateKey);
		console.log('   sessionStorage.publicKey =', sessionStorage.publicKey);
		console.log('   sessionStorage.publicAddress =', sessionStorage.publicAddress);

		$('#textOpenExistingWallet').val(sessionStorage.privateKey);

		let displayWalletInfo = '';
		if (sessionStorage.privateKey) {
			displayWalletInfo = "Existing private key: " + sessionStorage.privateKey + "\n" +
				"Extracted public key: " + sessionStorage.publicKey + "\n" +
				"Extracted public adress: " + sessionStorage.publicAddress;
		}

        $('#textareaOpenWalletResult').val(displayWalletInfo);

        showView("viewOpenExistingWallet");
    });

    $('#linkShowAccountBalance').click(function () {
		console.log('linkShowAccountBalance clicked');

		$('#textPublicAddressViewAccountBalance').val(sessionStorage.publicAddress);
		// $('#textBlockChainNodeViewAccountBalance').val('');
		$('#textareaDisplayBalance').val('');

        showView("viewShowAccountBalance");
    });

    $('#linkSendTransaction').click(function () {
		console.log('linkSendTransaction clicked');

        $('#senderPublicAddress').val(sessionStorage.publicAddress);

        $('#recipientPublicAddress').val('');
        $('#valueAmountToSend').val('');
        $('#feeAmountToSend').val('10');
        $('#dataToSend').val('');
        // $('#blockchainNodeViewSendTransaction').val('');

        $('#textareaSignTransaction').val('');
        $('#textareaSendTransactionResult').val('');

        showView("viewSendTransaction");
    });

    $('#buttonGenerateNewWallet').click(generateNewWallet);
    $('#buttonOpenExistingWallet').click(openWallet);
    $('#buttonViewAccountBalance').click(showAccountBalance);
    $('#buttonSignTransaction').click(signTransaction);
    $('#buttonSendSignedTransaction').click(sendSignedTransaction);

    $('#buttonClearFieldsInOpenExistingWallet').click(clearFieldsInOpenExistingWallet);

    $('#linkDelete').click(deleteWallet);

    function showView(viewName) {
        // Hide all views and show the selected view only
        $('main > section').hide();
        $('#' + viewName).show();

        if (sessionStorage.privateKey) {
            $('#linkCreateNewWallet').show();
            $('#linkOpenExistingWallet').show();

            $('#linkShowAccountBalance').show();
            $('#linkSendTransaction').show();
            $('#linkDelete').show();
        }
        else {
            $('#linkShowAccountBalance').hide();
            $('#linkSendTransaction').hide();
            $('#linkDelete').hide();

            $('#linkCreateNewWallet').show();
            $('#linkOpenExistingWallet').show();
        }
    }

    function showInfo(message) {
        $('#infoBox>p').html(message);
        $('#infoBox').show();
        $('#infoBox>header').click(function () {
            $('#infoBox').hide();
        })
    }

    function hideInfo() {
		$('#infoBox').hide();
	}

    function showError(errorMsg) {
        $('#errorBox>p').html('Error: ' + errorMsg);
        $('#errorBox').show();
        $('#errorBox>header').click(function () {
            $('#errorBox').hide();
        })
    }

    function showLoadingProgress(percent) {
        $('#loadingBox').html("Loading... " + parseInt(percent * 100) + "% complete");
        $('#loadingBox').show();
        $('#loadingBox>header').click(function () {
            $('#errorBox').hide();
        })
    }

    function hideLoadingBar() {
        $('#loadingBox').hide();
    }

    function generateNewWallet() {
		let privateKey = generateRandomPrivateKey();
		let publicKey = getPublicKeyFromPrivateKey(privateKey);
		let publicAddress = getPublicAddressFromPublicKey(publicKey);

		sessionStorage['privateKey'] = privateKey.padStart(64, '0');
		sessionStorage['publicKey'] = publicKey.padStart(65, '0');
		sessionStorage['publicAddress'] = publicAddress.padStart(40, '0');

		let displayWalletInfo = "Generated random private key: " + privateKey + "\n" +
				"Extracted public key: " + publicKey + "\n" +
				"Extracted public adress: " + publicAddress;

		$('#textareaCreateWalletResult').val(displayWalletInfo);

		// Below done so that other appropriate hyperlinks in header show up.
		showView("viewCreateNewWallet");
    }

    function openWallet() {
        let privateKey = $('#textOpenExistingWallet').val().trim().toLowerCase();
        if (privateKey.length === 0) {
			showError("The Private Key cannot be an empty string or consist only of white space. Please enter a " +
				"Private Key value that is a 64-hex valued lower case string.");
			return;
		}
		if (!isValidPrivateKey(privateKey)) {
			showError("Entered Private Key is not a 64-hex valued lower case string. " +
				"Please enter a Private Key that is a 64-hex valued lower case string.");
			return;
		}

		let publicKey = getPublicKeyFromPrivateKey(privateKey);
		let publicAddress = getPublicAddressFromPublicKey(publicKey);

		sessionStorage['privateKey'] = privateKey.padStart(64, '0');
		sessionStorage['publicKey'] = publicKey.padStart(65, '0');
		sessionStorage['publicAddress'] = publicAddress.padStart(40, '0');

		let displayWalletInfo = "Existing private key: " + privateKey + "\n" +
				"Extracted public key: " + publicKey + "\n" +
				"Extracted public adress: " + publicAddress;

		$('#textareaOpenWalletResult').val(displayWalletInfo);

		// Below done so that other appropriate hyperlinks in header show up.
		showView("viewOpenExistingWallet");
    }

    function clearFieldsInOpenExistingWallet() {
		$('#textOpenExistingWallet').val('');
        $('#textareaOpenWalletResult').val('');
	}

    async function showAccountBalance() {
		// Validate the Chain Node URL entered.
		let nodeIdUrl = $('#textBlockChainNodeViewAccountBalance').val().trim();
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

		let publicAddress =  $('#textPublicAddressViewAccountBalance').val();
		let restfulUrl = nodeIdUrl + "/address/" + publicAddress + "/balance";
		let restfulSuccessfulResponse = undefined;
		let restfulErrorResponse = undefined;

		showInfo(`Waiting for response from Blockchain Node ${nodeIdUrl} ....`);

		await axios.get(restfulUrl, {timeout: restfulCallTimeout})
			.then(function (response) {
				// console.log('response = ', response);
				// console.log('response.data =', response.data);
				// console.log('response.status =', response.status);
				// console.log('response.statusText =', response.statusText);
				// console.log('response.headers =', response.headers);
				// console.log('response.config =', response.config);
				restfulSuccessfulResponse = response.data;
			})
			.catch(function (error) {
				// console.log('error =', error);
				restfulErrorResponse = error;
  		});

  		hideInfo();

  		let errorMessage = undefined;
  		let displayBalanceInfo = undefined;

		// If the RESTFul call to Blockchain Node yielded no response after the timeout, then just display an error message.
		if (restfulSuccessfulResponse === undefined && restfulErrorResponse === undefined) {
			errorMessage = `Attempt to call ${restfulUrl } to obtain account balance failed due to timeout - unable to ` +
				`get account balance.`
			showError(errorMessage);
		}
		else if (restfulErrorResponse !== undefined) {
			errorMessage = `Attempt to call ${restfulUrl } to obtain account balance failed due to error message - unable to ` +
				`get account balance. See details of error in text area under the 'Display Balance' button.`;
			showError(errorMessage);

			// Technique to prettify obtained from the https://coderwall.com/p/buwfjw/pretty-print-json-with-native-javascript
			// web page.
			displayBalanceInfo = JSON.stringify(restfulErrorResponse, undefined, 2);
			$('#textareaDisplayBalance').val(displayBalanceInfo);
		}
		else { // restfulSuccessfulResponse !== undefined
			let displayBalanceInfo = "Balance (6 confirmations or more): " + restfulSuccessfulResponse.safeBalance + "\n" +
					"Balance (1 confirmation or more): " + restfulSuccessfulResponse.confirmedBalance + "\n" +
					"Balance (pending - 0 or more confirmations): " + restfulSuccessfulResponse.pendingBalance;
			$('#textareaDisplayBalance').val(displayBalanceInfo);
		}
    }

    function signTransaction() {
		console.log('signTransaction function entered');

		// No need to check validity for a read-only text field.
 		let senderPublicAddress = $('#senderPublicAddress').val().trim().toLowerCase();

		// Check for validity of Recipient Public Address.
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

		// Check that Fee is greater than or equal to 10.
		feeAmount = parseInt(feeAmount);
		if (feeAmount < 10) {
			showError("Entered Fee is not a positive integer greater than or equal to 10. " +
				"Please enter a Fee that is positive integer greater than or equal to 10.");
			return;
		}

		let dataToSend = $('#dataToSend').val().trim();

		console.log('signTransaction function passed all input tests');

		// Transaction constructor below automatically calculates the Transaction Data Hash based on the
		// input parameters to the constructor.
		let dateCreated = new Date().toISOString();
		let senderPubKey = sessionStorage.publicKey;
		let transactionToSign = new Transaction(
				senderPublicAddress, // address (40 hex digits) string
				recipientPublicAddress, // address (40 hex digits) string
				amountToSendValue, // integer (non negative)
				feeAmount, // integer (non negative)
				dateCreated, // ISO8601_string
				dataToSend, // string (optional)
				senderPubKey); // hex_number[65] string

		// Sign the Transaction to Send and get it's signature.
		//
		// Output: A Signature JavaScript object that has the following two main attributes:
		// 1) r : 64-Hex string of the Signature "r" attribute
		// 2) s : 64-Hex string of the Signature "s" attribute
		let signature = createSignature(transactionToSign.transactionDataHash, sessionStorage.privateKey);
		let senderSignatureArray = [ signature.r, signature.s ];

		let transactionToSend = {
				from: transactionToSign.from,
				to: transactionToSign.to,
				value: transactionToSign.value,
				fee: transactionToSign.fee,
				dateCreated: transactionToSign.dateCreated,
				data: transactionToSign.data,
				senderPubKey: transactionToSign.senderPubKey,
				senderSignature: senderSignatureArray
		}

		let displaySignedTransaction = JSON.stringify(transactionToSend, undefined, 2);
		$('#textareaSignTransaction').val(displaySignedTransaction);
    }

    function sendSignedTransaction() {
		console.log('sendSignedTransaction function entered');

		// Validate the Chain Node URL entered.
		let nodeIdUrl = $('#blockchainNodeViewSendTransaction').val().trim();
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

        let signedTransactionJsonString = $('#textareaSignTransaction').val();
        if (signedTransactionJsonString.length === 0) {
			showError("No Transaction has been signed to be sent. Please create and sign a Transaction " +
				"before trying to send a Transaction.");
			return;
		}

		console.log('sendSignedTransaction function passed all input tests');
    }

    function deleteWallet() {
        sessionStorage.clear();
        showView('viewHome');
    }

});