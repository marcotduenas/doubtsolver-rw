import { genSalt, hash } from 'bcrypt';

async function hash_user_password(user_passkey) {
	try{	
		const hash_complexity_rounds = 10; //Salts
		const hash_complexity = await genSalt(hash_complexity_rounds);

		const password_after_hash = await hash(user_passkey, hash_complexity);

		return password_after_hash;
	} catch (error) {
		console.error('Error generating hash', error);
		throw error;
	}
}

export default hash_user_password;
