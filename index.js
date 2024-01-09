import express from 'express';
import helmet from 'helmet';
import path from 'path';
import escape_html from 'escape-html';
import password_hash from './_public/scripts/password_hash.mjs';
import { Database } from "bun:sqlite";
import { compare } from 'bcrypt';
const port = 6969;

//Connecting to the registered users database
const users_db = new Database("./databases/users_database.sqlite");

const application = express();

application.use(helmet());
application.use(express.static(path.join(__dirname, '_public')));
application.use(express.urlencoded({ extendend: true }));

application.get('/', (req, res) => {
	let index_page = path.join(__dirname, './_public/templates', 'index.html');
	res.sendFile(index_page);
	
});


application.post('/', (req, res) => {
	
	//Getting form values to be treated
	const user_nickname = req.body.user_nickname
	const user_passkey = req.body.user_passkey

	//Security validation
	if (!user_nickname || typeof user_nickname != 'string' || user_nickname.trim() === '') {
		return res.status(400).send('Invalid nickname!');
	}

	if (!user_passkey || typeof user_passkey != 'string' || user_passkey.trim() === ''){
		return res.status(400).send('Invalid password!');
	}

	const escaped_user_nickname = escape_html(user_nickname);
	const escaped_user_passkey = escape_html(user_passkey);

	user_auth(escaped_user_nickname, escaped_user_passkey);

});


application.get('/signup', (req, res) => {
	let signup_page = path.join(__dirname, './_public/templates', 'signup.html');
	res.sendFile(signup_page);

});

application.post('/signup', (req, res) => {
	const user_registered_nickname = req.body.user_nickname;
	const user_registered_password = req.body.user_passkey;

	//Security validation
	if (!user_registered_nickname || typeof user_registered_nickname != 'string' || user_registered_nickname.trim() === '') {
		return res.status(400).send('Invalid nickname!');
	}

	if (!user_registered_password|| typeof user_registered_password != 'string' || user_registered_password.trim() === ''){
		return res.status(400).send('Invalid password!');
	}

	const escaped_register_name = escape_html(user_registered_nickname);
	const escaped_register_password = escape_html(user_registered_password);

	password_hash(escaped_register_password)
		.then((hashed_password) => {
			const user_hashed_password = hashed_password;
			console.log(escaped_register_name);
			console.log(user_hashed_password);
			let register_query = users_db.query(`INSERT INTO users (user_nick, user_pass) VALUES ('${escaped_register_name}', '${user_hashed_password}')`);
			register_query.run();
		})
		.catch((error) => {
			console.log("Error: ", error);
		});

});

application.listen(port, () => {
	console.log(`Started at http://localhost:${port}`);
});


async function user_auth(nickname, inserted_password){
	try{
		const get_user_query = `SELECT user_pass FROM users WHERE user_nick = '${nickname}'`;
		const user_found = await users_db.query(get_user_query).get();

		if (user_found){
			const stored_hashed_password = user_found.user_pass;
			const correct_password = await compare(inserted_password, stored_hashed_password);

			if (correct_password){
				console.log("User logged in!");
			}else{
				console.log("Incorrect password");
			}
		}else{
			console.log("User not found");
		}
	}catch (error){
		console.error("Error during authentication: ", error);
	}
}
