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
		$('#textBlockChainNodeViewAccountBalance').val('');
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

        $('#textareaSignedTransactionResult').val('');
        $('#textareaSendTransactionResult').val('');

        showView("viewSendTransaction");
    });

    $('#buttonGenerateNewWallet').click(generateNewWallet);
    $('#buttonOpenExistingWallet').click(openWallet);
    $('#buttonViewAccountBalance').click(showAccountBalance);
    $('#buttonSignTransaction').click(signTransaction);
    $('#buttonSendSignedTransaction').click(sendSignedTransaction);

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
        let privateKey = $('#textOpenExistingWallet').val();
		if (!isValidPrivateKey(privateKey)) {
			showError("Entered private key is not a 64-hex valued lower case string");
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

    function unlockWalletAndDeriveAddresses() {
        // TODO:
        let password = $('#passwordSendTransaction').val();
        let json = localStorage.JSON;

        decryptWallet(json, password)
        	.then(wallet => {
				showInfo("Wallet successfully unlocked!");
				renderAddresses(wallet);
				$('#divSignAndSendTransaction').show();
			})
			.catch(showError)
			.finally(()=> {
				$('#passwordSendTransaction').val('');
				hideLoadingBar();
			});

		function renderAddresses(wallet) {
			$('#senderAddress').empty();

			// let masterNode = ethers.HDNode.fromMnemonic(wallet.mnemonic);
			for (let i = 0; i < 5; i++) {
				// let wallet = new ethers.Wallet(masterNode.derivePath(derivationPath + i).privateKey, provider);
				// let address = wallet.address;

				// wallets[address] = wallet;
				// let option = $(`<option id=${wallet.address}>`).text(address);
				// $('#senderAddress').append(option);
			}
		}
    }

    function signTransaction() {
        // TODO:
        let senderAddress = $('#senderAddress option:selected').attr('id');

        // let wallet = wallets[senderAddress];
        // if (!wallet) {
		//	return showError("Invalid address!");
		// }

		let recipient = $('#recipientAddress').val();
		if (!recipient) {
			return showError("Invalid recipient!");
		}

		let value = $('#transferValue').val();
		if (!value) {
			return showError("Invalid transfer value!");
		}

		// wallet.getTransactionCount()
		//	.then(signTransaction)
		//	.catch(showError);

		function signTransaction(nonce) {
			let transaction = {
				nonce,
				gasLimit: 21000,
				gasPrice: 12, // ethers.utils.bigNumberify("20000000000"),
				to: recipient,
				value: 12, // ethers.utils.parseEther(value.toString()),
				data: "0x",
				chainId: 12 // provider.chainId
			};

			// let signedTransaction = wallet.sign(transaction);
			// $('#textareaSignedTransaction').val(signedTransaction);
		}
    }

    function sendSignedTransaction() {
        // TODO:
        let signedTransaction = $('#textareaSignedTransaction').val();
        // provider.sendTransaction(signedTransaction)
        //	.then(hash => {
		//		showInfo("Transaction hash: " + hash);
        //
		//		let etherscanUrl = 'https://ropsten.etherscan.io/tx/' + hash;
		//		$('#textareaSendTransactionResult').val(etherscanUrl);
		//	})
		//	.catch(showError);
    }

    function deleteWallet() {
        sessionStorage.clear();
        showView('viewHome');
    }

});