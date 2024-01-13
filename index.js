import express from 'express';
import session from 'express-session';
import ejs from 'ejs';
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
application.use(express.urlencoded({ extended: true }));
application.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: true,
}));

application.set('views', path.join(__dirname, '_public/templates'));
application.set('view engine', 'ejs');

application.get('/', (req, res) => {
	let index_page = path.join(__dirname, './_public/templates', 'doubt.html');
	res.sendFile(index_page);	
});

application.post('/', async(req, res) => {
	const asker_name = escape_html(req.body.name);
	const study_area = escape_html(req.body.study_area);
	const doubt_description = escape_html(req.body.doubt_desc);

	console.log(asker_name, study_area, doubt_description);

	if (!asker_name || typeof asker_name != 'string' || asker_name.trim() === '') {
		return res.status(400).send('Invalid nickname!');
	}

	if (!study_area || typeof study_area != 'string' || study_area.trim() === ''){
		return res.status(400).send('Specify the study area in the correct way');
	}

	if (!doubt_description || typeof doubt_description != 'string' || study_area.trim() === ''){
		return res.status(400).send('Explain your doubt in a better way');
	}

	const save_doubt_query = doubts_db.query('INSERT INTO doubts (asker_username, doubt_area, doubt_desc) VALUES ($asker_name, $study_area, $doubt_description)');
    await save_doubt_query.run({ $asker_name: asker_name, $study_area: study_area, $doubt_description: doubt_description });


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
	
	if (user_auth(user_nickname, user_passkey)){
		req.session.user = {username: user_nickname, user_pass: user_passkey };
		res.redirect('/doubts-list');
	}

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

application.get('/doubts-list', async (req, res) => {
    try {
        let get_all_doubts = 'SELECT * FROM doubts';
        let chosen_study_area = null;

        if (req.query.chosen_study_area) {
            chosen_study_area = req.query.chosen_study_area;
            get_all_doubts += ` WHERE doubt_area = $1`;
        }

		const doubts_find = await doubts_db.query(get_all_doubts).all({ $1: chosen_study_area });

		if(req.session.user){
			res.render('doubts_list', { doubts: doubts_find });
		}else{
			res.redirect('/login');
		}

    } catch (error) {
        console.error('Error fetching data: ', error);
        res.status(500).send('Internal Server Error');
    }

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

