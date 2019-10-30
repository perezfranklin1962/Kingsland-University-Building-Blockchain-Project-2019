var express = require('express');
var app = express();

// This responds with "Hello World" on the homepage
app.get('/', function (req, res) {
   console.log("Got a GET request for the homepage");
   res.send('Hello GET');
});

var listeningPort = 5555;

var server = app.listen(listeningPort, function () {
   var host = server.address().address
   var port = server.address().port

   if (host == "::") {
	   host = "localhost";
   }

   console.log("Example app listening at http://%s:%s", host, port);
});