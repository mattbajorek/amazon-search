// Require libraries
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var amazon = require('amazon-product-api');
var mysql = require('mysql');
var config = require('./config');

// Sets up the Express App
var app = express();
var PORT = process.env.PORT || 3000;

// Sets up the Express app to handle data parsing 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.text());
app.use(bodyParser.json({type:'application/vnd.api+json'}));

// Connect to database
var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root", //Your username
  password: "", //Your password
  database: "AmazonDB"
});

connection.connect(function(err) {
  if (err) throw err;
});

// Create client
var client = amazon.createClient({
  awsId: config.keys.awsId,
  awsSecret: config.keys.awsSecret,
  awsTag: config.keys.awsTag
});

// Router for main html page
app.get('/', function(req, res){
	res.sendFile(path.join(__dirname, './index.html'));
})

// Router for main html page
app.get('/data', function(req, res){

	var query = 'SELECT * FROM Products';
	connection.query(query, function(error, response) {
    if (error) {
    	res.send(error);
    } else {
    	res.json(response);
    }
  });

})

// Router for ajax get search
app.get('/search/:search', function(req, res){
	// Test search
	client.itemSearch({
		keywords: req.params.search,
	  responseGroup: 'ItemAttributes'
	}, function(err, results, response) {
	  if (err) {
	    console.log(err);
	    res.status(404).send('Not found');
	  } else {
	  	var obj = {};
	  	if (results !== undefined) {
	  		obj.ASIN = results[0].ASIN !== undefined ? results[0].ASIN[0] : 'Unavailable';
	  		if (results[0].ItemAttributes !== undefined) {
	  			obj.Title = results[0].ItemAttributes[0].Title !== undefined ? results[0].ItemAttributes[0].Title[0] : 'Unavailable';
		  		obj.MPN = results[0].ItemAttributes[0].MPN !== undefined ? results[0].ItemAttributes[0].MPN[0] : 'Unavailable';
		  		obj.Price = results[0].ItemAttributes[0].ListPrice !== undefined ? results[0].ItemAttributes[0].ListPrice[0].FormattedPrice[0] : 'Unavailable';
	  		}
	  	}
	  	res.json(obj);
	  }
	});
})

// Router for ajax post add
app.post('/add', function(req, res){
	
	var query = 'INSERT INTO Products (ASIN,Title,MPN,Price) VALUES (?,?,?,?)';
	var params = [req.body.ASIN, req.body.Title, req.body.MPN, req.body.Price];
	connection.query(query, params, function(error, response) {
    if (error) {
    	res.send(error);
    } else {
    	res.send(response);
    }
  });

})

// Starts the server to begin listening
app.listen(PORT, function(){
	console.log('App listening on PORT ' + PORT);
})