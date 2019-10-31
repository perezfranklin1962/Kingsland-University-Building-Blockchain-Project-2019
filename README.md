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

