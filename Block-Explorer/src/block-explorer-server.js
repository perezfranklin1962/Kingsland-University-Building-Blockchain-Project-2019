// Create the Express app
const express = require("express");
const app = express();

// Enable static access to the "/public" folder
app.use(express.static('../public'));

const server = app.listen(9999, function(){
    console.log('Server started: http://localhost:' + server.address().port);
});
