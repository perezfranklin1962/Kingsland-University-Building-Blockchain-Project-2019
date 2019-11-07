# Kingsland-University-Building-Blockchain-Project-2019
This is the repository used by Franklin Perez for the Building Blockchain Project assignment of the M5 Advanced Project Course of October/November 2019.

The code is written in JavaScript.

Used "npm init" command to create the "package.json" file.

The Node.js Express Framework was used to create and accept the RESTFul Web Service calls. You may view this Node.js Express Framework in the https://www.tutorialspoint.com/nodejs/nodejs_express_framework.htm web page.

In order to use the Node.js Express Framework, you have to install it on your computer. I tried to install it using the "npm install -g express" command, but when I ran "node NodeServer.js", node still could not recognize "express". I was abe to then use the following command to successfully install the "express" library:
npm install express --save

The "commander" Node.js library was used to allow ease in adding and handling command-line arguments. This is explained in the https://alligator.io/nodejs/command-line-arguments-node-scripts web page. The following command was used to intall "commander" to this project:
npm install commander --save

The "http-status-codes" Node.js library was used to get a handle on all the HttpStatus codes. Tried to use "npm install -g http-status-codes" to install globally. It successfully installed globally, but
when I ran "node Node/research/NodeIdTest.js", the Node program could not find the global location. What worked was the "npm install http-status-codes --save" command. Please see the https://stackoverflow.com/questions/18765869/accessing-http-status-code-constants and https://github.com/prettymuchbryce/http-status-codes web pages for reference.

The "axios" Node.js library is used to make RESTFul Web Service calls from JavaScript.  Tried to use "npm install -g axios" to install globally. It successfully installed globally, but
when I ran "node Node/research/FranklinCryptoUtility.js", the Node program could not find the global location. What worked was the "npm install axios --save" command. Please see the https://www.twilio.com/blog/2017/08/http-requests-in-node-js.html and https://github.com/axios/axios web pages for reference.

The "elliptic" and "crypto-js" Node.js libraries are needed to do Public/Private Key Encryption for the Addresses and Signature signing/verification. Research on doing this may be seen in the "Nodes/research/FranklinCryptoUtility.js" file along with the referenced hyperlinks explaining where the information was obtained. Read the "Nodes/research/FranklinCryptoUtility.js" file on how to import and install the "elliptic" and "crypto-js" Node.js libraries.

The Faucet Address is used as the Address that will initially receive ALL the micro-coins in the Genesis Block and to be used as the address from which crypto-coins will be obtained in the Faucet App. The "Node/research/FranklinCryptoUtility.js" script was used to randomly generate the Private Key, Public Key, and Public Address of the Faucet Address. In a normal Blockain, the code should never contain the Private Key of the Public Address used in the "to" address of the Coinbase Transaction in the Genesis Block, and thus, the Private Key of the Faucet Address will not be be placed in the code either; the same will be done here also, and only the Faucet Public Address will be hardcoded in this Blockchain software. But, since this is a classroom project, though, the Private Key will be publicly documented so that users of this Project will be able to withdraw funds from the Facucet Address. 

Thus, the Faucet Addresses are as follows:
1) Faucet Private Key: 37fa69286acb4c45b9c4331d192910d91482d5c8628ae10d56c23d9f2d184aee (64 Hex Digits)
2) Faucet Public Key: 975be465d4c8a8dd60335188766e83cf4a5bf61a6a3bf6ea2b51076c53f41c0d0 (65 Hex Digits)
3) Faucet Public Address: fce3a061a500b8f3fb10eb29a55f24941f7444de (40 Hex Digits)

The Miner Address is the address of a Miner that will be receiving the Block Rewards. I've set up, by default, in the Miner/Miner.js file a Miner Address as follows:
1) Miner Private Key: 77f629beda064e88513248d04ec93c5cd6e8d014924b59f8114db44f1cc223c7
2) Miner Public Key: a37cac48fe1eb182ab7de346cb4d96c2e0e4e221779b4ddfcbf13c88b4c6be991
3) Miner Public Address: b63a0fe3f5f5ffc6a800f51594eee600082ad57f

