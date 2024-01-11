import express from 'express';
import helmet from 'helmet';
import path from 'path';
import escape_html from 'escape-html';
import password_hash from './_public/scripts/password_hash.mjs';
import { Database } from "bun:sqlite";
import { compare } from 'bcrypt';
const port = 6969;

//Connecting to databases
const users_db = new Database("./databases/users_database.sqlite");
const doubts_db = new Database("./databases/doubts_database.sqlite");

const application = express();

application.use(helmet());
application.use(express.static(path.join(__dirname, '_public')));
application.use(express.urlencoded({ extendend: true }));

application.get('/', (req, res) => {
	let index_page = path.join(__dirname, './_public/templates', 'doubt.html');
	res.sendFile(index_page);	
});

application.post('/', (req, res) => {
	const asker_name = escape_html(req.body.name);
	const study_area = escape_html(req.body.study_area);
	const doubt_description = escape_html(req.body.doubt_desc);

	if (!asker_name || typeof asker_name != 'string' || asker_name.trim() === '') {
		return res.status(400).send('Invalid nickname!');
	}

	if (!study_area || typeof study_area != 'string' || study_area.trim() === ''){
		return res.status(400).send('Specify the study area in the correct way');
	}

	if (!doubt_description || typeof doubt_description != 'string' || study_area.trim() === ''){
		return res.status(400).send('Explain your doubt in a better way');
	}


});

application.get('/login', (req, res) => {
	let login_page = path.join(__dirname, './_public/templates', 'login.html');
	res.sendFile(login_page);
});


application.post('/login', (req, res) => {
	
	//Getting form values to be treated
	const user_nickname = escape_html(req.body.user_nickname);
	const user_passkey = escape_html(req.body.user_passkey);

	//Security validation
	if (!user_nickname || typeof user_nickname != 'string' || user_nickname.trim() === '') {
		return res.status(400).send('Invalid nickname!');
	}

	if (!user_passkey || typeof user_passkey != 'string' || user_passkey.trim() === ''){
		return res.status(400).send('Invalid password!');
	}
	
	user_auth(user_nickname, user_passkey);

});


application.get('/signup', (req, res) => {
	let signup_page = path.join(__dirname, './_public/templates', 'signup.html');
	res.sendFile(signup_page);

});

application.post('/signup', async (req, res) => {
	const user_registered_nickname = escape_html(req.body.user_nickname);
	const user_registered_password = escape_html(req.body.user_passkey);
	
	if (!user_registered_nickname || typeof user_registered_nickname !== 'string' || user_registered_nickname.trim() === '') {
            return res.status(400).send('Invalid nickname!');
	}

    if (!user_registered_password || typeof user_registered_password !== 'string' || user_registered_password.trim() === '') {
            return res.status(400).send('Invalid password!');
    }

	const hashed_password = await password_hash(user_registered_password);

	const register_query = users_db.query('INSERT INTO users (user_nick, user_pass) VALUES ($1, $2)');
    await register_query.run(user_registered_nickname, hashed_password);
});

application.listen(port, () => {
	console.log(`Started at http://localhost:${port}`);
});

async function user_auth(nickname, inserted_password) {
    try {
		const get_user_query = users_db.query(`SELECT user_pass FROM users WHERE user_nick = $1`);
		const user_found = await get_user_query.get({ $1: nickname });

        if (user_found) {
            const stored_hashed_password = user_found.user_pass;
            const correct_password = await compare(inserted_password, stored_hashed_password);

            if (correct_password) {
                console.log("User logged in!");
            } else {
                console.log("Incorrect password");
            }
        } else {
            console.log("User not found");
        }
    } catch (error) {
        console.error("Error during authentication: ", error);
    }
}

