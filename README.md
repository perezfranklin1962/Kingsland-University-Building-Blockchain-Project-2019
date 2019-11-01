# Kingsland-University-Building-Blockchain-Project-2019
This is the repository used by Franklin Perez for the Building Blockchain Project assignment of the M5 Advanced Project Course of October/November 2019.

The code is written in JavaScript.

Used "npm init" command to create the "package.json" file.

The Node.js Express Framework was used to create and accept the RESTFul Web Service calls. You may view this Node.js Express Framework in the https://www.tutorialspoint.com/nodejs/nodejs_express_framework.htm web page.

In order to use the Node.js Express Framework, you have to install it on your computer. I tried to install it using the "npm install -g express" command, but when I ran "node NodeServer.js", node still could not recognize "express". I was abe to then use the following command to successfully install the "express" library:
npm install express --save

The "commander" Node.js library was used to allow ease in adding and handling command-line arguments. This is explained in the https://alligator.io/nodejs/command-line-arguments-node-scripts web page. The following command was used to intall "commander" to this project:
npm install commander --save

The "elliptic" and "crypto-js" Node.js libraries are needed to do Public/Private Key Encryption for the Addresses and Signature signing/verification. Research on doing this may be seen in the "Nodes/research/FranklinCryptoUtility.js" file along with the referenced hyperlinks explaining where the information was obtained. Read the "Nodes/research/FranklinCryptoUtility.js" file on how to import and install the "elliptic" and "crypto-js" Node.js libraries.

The Faucet Address is used as the Address that will initially receive ALL the crpto-coins in the Genesis Block and to be used as the address from which crypto-coins will be obtained in the Faucet App. The "Node/research/FranklinCryptoUtility.js" script was used to randomly generate the Private Key, Public Key, and Public Address of the Faucet Address. In a normal Blockain, the code should never contain the Private Key of the Public Address used in the "to" address of the Coinbase Transaction in the Genesis Block, and thus, the Private Key of the Faucet Address will not be be placed in the code either; the same will be done here also, and only the Faucet Public Address will be hardcoded in this Blockchain software. But, since this is a classroom project, though, the Private Key will be publicly documented so that users of this Project will be able to withdraw funds from the Facucet Address. 

Thus, the Faucet Addresses are as follows:
1) Faucet Private Key: 37fa69286acb4c45b9c4331d192910d91482d5c8628ae10d56c23d9f2d184aee (64 Hex Digits)
2) Faucet Public Key: 975be465d4c8a8dd60335188766e83cf4a5bf61a6a3bf6ea2b51076c53f41c0d0 (65 Hex Digits)
3) Faucet Public Address: fce3a061a500b8f3fb10eb29a55f24941f7444de (40 Hex Digits)

