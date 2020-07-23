const Joi = require('joi');
const mysql = require('mysql');
const express = require('express');
const app = express();

app.use(express.json());

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "nodejsproject"
});

connection.connect(function(err) {
  if (err) throw err;
  console.log("Connected to database!");
});


app.use((req, res, next) => {
    res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
        'Access-Control-Allow-Headers' : '*'
    });
    next();
});

//----------------------------------------------------------

app.post('/api/login', (req, res) => {
	console.log(req.body);
	connection.query( `SELECT * FROM user WHERE email = '${req.body.email}' AND password = '${req.body.password}'` ,(err, result, fields) => {
		if (err) throw err;
	
		if(result == 0)
			res.status(201).json("Either email or password is incorrect");
		else
			res.json("You are logged in...");
	});
});


app.post('/api/user', (req, res) => {
	
	var info = validate(req.body);
	
	if( info.error ){
        // 400 Bad Request
        return res.status(400).json(info.error.details[0].message);
    }
	
	connection.query( `SELECT * FROM user WHERE email = '${req.body.email}'` ,(err, result, fields) => {
		if (err) throw err;
	
		if(result != 0)
		{
			res.status(400).json("Sorry, the email you're trying to register has already been registered...");
		}
		else
		{
			var sql = `INSERT INTO user (email, password, phone, credit) VALUES ('${req.body.email}', '${req.body.password}', '${req.body.phone}', 5000)`;
			connection.query(sql, function (err, result) {
															if (err) throw err;
															console.log("A new user has been registered");
															res.json("Successfully registered, you can now log in to your account");
														});
		}
    
	});
		
});

app.post('/credits', (req, res) => {
	console.log(req.body);
	connection.query( `SELECT credit FROM user WHERE email = '${req.body.email}'` ,(err, result, fields) => {
		if (err) throw err;
		
		console.log(result);
	
		if(result == 0)
			res.status(201).json("ERROR");
		else
			res.json(result[0].credit);
	});
});

app.get('/ticket/:email', (req, res) => {
	var ticket = {};
	
	connection.query( `SELECT COUNT(ticket) ticket FROM user_ticket WHERE email = '${req.params.email}' AND ticket = 'earlybird'` ,(err, result, fields) => {
		if (err) throw err;
		
		if(result == 0)
			ticket.earlybird = 0;
		else
			ticket.earlybird = result[0].ticket;
	});
	
	connection.query( `SELECT COUNT(ticket) ticket FROM user_ticket WHERE email = '${req.params.email}' AND ticket = 'regular'` ,(err, result, fields) => {
		if (err) throw err;
		
		if(result == 0)
			ticket.regular = 0;
		else
			ticket.regular = result[0].ticket;
	});
	
	connection.query( `SELECT COUNT(ticket) ticket FROM user_ticket WHERE email = '${req.params.email}' AND ticket = 'platinum'` ,(err, result, fields) => {
		if (err) throw err;
		
		if(result == 0)
			ticket.platinum = 0;
		else
			ticket.platinum = result[0].ticket;
		
		res.json(ticket);
	});
});

app.put('/buyticket', (req, res) => {

	connection.query( `SELECT credit FROM user WHERE email = '${req.body.email}' AND credit >= ${req.body.price}` ,(err, result, fields) => {
		if (err) throw err;
		
		if(result == 0)
			res.status(201).json("You don't have enough credits");
		else
		{
			connection.query( `UPDATE user SET credit = credit - ${req.body.price} WHERE email = '${req.body.email}'` ,(err, result, fields) => {
				if (err) throw err;
			});
			
			connection.query( `INSERT INTO user_ticket (email, ticket) VALUES ('${req.body.email}' , '${req.body.ticket}' )` ,(err, result, fields) => {
				if (err) throw err;
				
				res.json("Congratulations! you have bought the ticket");
			});
			
			
		}
	});
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})

function validate(information) {
	
    const schema = Joi.object({
		 email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),
		 password: Joi.string().pattern(new RegExp('[0-z]{8}')),
		 phone: Joi.number()
    });
    
	return schema.validate(information);
}