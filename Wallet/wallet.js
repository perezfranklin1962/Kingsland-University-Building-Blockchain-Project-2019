$(document).ready(function () {
    // const derivationPath = "m/44'/60'/0'/0/";
    // const provider = ethers.providers.getDefaultProvider('ropsten');

    // let wallets = {};

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
		// $('#textOpenExistingWallet').val(sessionStorage.wallet.privateKey);
		console.log('Clicked on linkOpenExistingWallet');
		console.log('   sessionStorage.privateKey =', sessionStorage.privateKey);
		console.log('   sessionStorage.publicKey =', sessionStorage.publicKey);
		console.log('   sessionStorage.publicAddress =', sessionStorage.publicAddress);

		$('#textOpenExistingWallet').val(sessionStorage.privateKey);
        $('#textareaOpenWalletResult').val('');
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

    function showLoggedInButtons() {
        $('#linkCreateNewWallet').hide();
        $('#linkOpenExistingWallet').hide();
        $('#linkImportWalletFromFile').hide();

        $('#linkShowMnemonic').show();
        $('#linkShowAccountBalance').show();
        $('#linkSendTransaction').show();
        $('#linkExportJsonToFile').show();
        $('#linkDelete').show();
    }

    function encryptAndSaveJSON(wallet, password) {
        // TODO:
        // return wallet.encrypt(password, {}, showLoadingProgress)
        //	.then(json => {
		//		localStorage.setItem('JSON', json);
		//		showLoggedInButtons();
		//	})
		//	.catch(showError)
		//	.finally(hideLoadingBar)
    }

    function decryptWallet(json, password) {
        // TODO:
        // return ethers.Wallet.fromEncryptedWallet(json, password, showLoadingProgress);
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
    }

    function saveJsonLocalStorageToFile() {
		let blob = new Blob([localStorage.JSON], {type: "text/plain"});
		let fileName = $('#textJsonFileName').val();

		saveAs(blob, fileName);
	}

    function openWalletFromFile() {
        // TODO:
        if ($('#walletForUpload')[0].files.length === 0) {
			return showError("Please select a file to upload.");
		}

		let password = $('#passwordUploadWallet').val();

		let fileReader = new FileReader();
		fileReader.onload = function () {
			let json = fileReader.result;

			decryptWallet(json, password)
				.then(wallet => {

					// Check that the JSON is generated from a mnemonic and not from a single private key
					if (!wallet.mnemonic) {
						return showError("Invalid JSON file!");
					}

					localStorage.setItem('JSON', json);
					showInfo("Wallet successfully loaded!");
					showLoggedInButtons();
				})
				.catch(showError) // It shows "Error: Error: invalid password" when using the "no-mnemonic-wallet" file!
				.finally(hideLoadingBar)
		};

		fileReader.readAsText($('#walletForUpload')[0].files[0]);
    }

    function showMnemonic() {
        // TODO:
        let password = $('#passwordShowMnemonic').val();
        let json = localStorage.JSON;

        decryptWallet(json, password)
        	.then(wallet => {
				showInfo("Your mnemonic is: " + wallet.mnemonic);
		})
		.catch(showError)
		.finally(hideLoadingBar)
    }

    function showAccountBalance() {

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
        // TODO:
        sessionStorage.clear();
        showView('viewHome');
    }

});