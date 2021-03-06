const Joi = require('joi');
const express = require('express');
const app = express();
const connection = require('./databaseconnection.js');

app.use(express.json());



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
		{
			console.log(`${req.body.email} logged in at ${new Date()}`);
			res.json("You are logged in...");
		}
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
															console.log(`Email: ${req.body.email} \n Password: ${req.body.password} \n Phone: ${req.body.phone} \n Credits: 5000`);
															res.json("Successfully registered, you can now log in to your account");
														});
		}
    
	});
		
});

app.post('/credits', (req, res) => {
	console.log(req.body);
	connection.query( `SELECT credit FROM user WHERE email = '${req.body.email}'` ,(err, result, fields) => {
		if (err) throw err;
		
		//console.log(`${req.body.email} credits: ${result[0].credit}`);
	
		if(result == 0)
			res.status(201).json("ERROR");
		else
			res.json(result[0].credit);
	});
});

app.get('/ticket/:email', (req, res) => {
	var ticket = {};
	var sql = 	`SELECT COUNT(ticket) earlybird, 
				(SELECT COUNT(ticket) FROM user_ticket WHERE email = "${req.params.email}" AND ticket = 'regular')regular, 
				(SELECT COUNT(ticket) FROM user_ticket WHERE email = "${req.params.email}" AND ticket = 'platinum')platinum 
				FROM user_ticket WHERE email = '${req.params.email}' AND ticket = 'earlybird'`;
	
	connection.query(sql,(err, result, fields) => {
		if (err) throw err;
		
		ticket.earlybird = result[0].earlybird;
		ticket.regular = result[0].regular;
		ticket.platinum = result[0].platinum;
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
		 email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).max(30),
		 password: Joi.string().pattern(new RegExp('[ -~]{8,30}')),
		 phone: Joi.string().max(30)
    });
    
	return schema.validate(information);
}