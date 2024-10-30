//
import os from 'node:os';
import express, {json} from 'express';
// import helmet from 'helmet';
import * as dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import {body, matchedData, validationResult} from 'express-validator';
import {existsSync, readFileSync, writeFileSync} from 'fs';
import * as fs from 'fs';
import dns from 'dns';
import * as csv from 'csv';
import {error} from 'node:console';
import {randomNumber} from './utils/index.js';

dotenv.config();

const app = express();
app.use(express.json());
// app.use(helmet()); // helmet Starten
//
const PORT = process.env.PORT || 5000;
//
const NEWSLETTER_EMAILS_LIST_PATH = process.cwd() + '/newsletter_emails.csv';
const EMAIL_TOKEN_LIST_PATH = process.cwd() + '/emails_token_list.json';
let emails = [];
let emailBuffer;
const token = 'einen_sehr_komplizierte_token' + randomNumber(0, 1000);
let tokens = [];

//
// Konvertiere das Array von Objekten in ein CSV-Format
const writeCSV = (data) => {
	csv.stringify(data, {header: true}, (err, output) => {
		if (err) {
			console.error('Fehler beim Schreiben der CSV-Datei:', err);

			return;
		}

		// Schreibe die CSV-Daten in eine Datei
		fs.writeFile('emails.csv', output, (err) => {
			if (err) {
				console.error('Fehler beim Schreiben der Datei:', err);
			} else {
				console.log('Die CSV-Datei wurde erfolgreich geschrieben.');
			}
		});
	});
};
const readCSV = () => {
	if (!fs.existsSync('emails.csv')) {
		return;
	}
	fs.readFile('emails.csv', 'utf8', (err, data) => {
		if (err) {
			console.error('Fehler beim Lesen der Datei:', err);
			return;
		}

		// Parst die CSV-Daten in ein Array von Objekten
		csv.parse(data, {columns: true}, (err, records) => {
			if (err) {
				console.error('Fehler beim Parsen der CSV-Daten:', err);
			} else {
				// console.log('CSV-Daten erfolgreich gelesen:', records);
				emails = records;
			}
		});
	});
};
const writeEmailsToken = () => {
	writeFileSync(EMAIL_TOKEN_LIST_PATH, JSON.stringify(tokens));
};
const loadEmailsToken = () => {
	if (existsSync(EMAIL_TOKEN_LIST_PATH)) {
		tokens = JSON.parse(readFileSync(EMAIL_TOKEN_LIST_PATH));
	} else {
		console.info(`Der Datei mit Emails Tokens existiert noch nicht, wird demnächst erstellt `);
	}
};

const transporter = nodemailer.createTransport({
	host: process.env.MAIL_HOST,
	port: process.env.MAIL_PORT,
	secure: false, // Use `true` for port 465, `false` for all other ports
	auth: {
		user: process.env.MAIL_USER,
		pass: process.env.MAIL_PASSWORD,
	},
});
//__________________________________________________
app.use(express.static('newsletter_shapovalov.html'));

app.get('/', (req, res) => {
	res.sendFile(process.cwd() + '/newsletter_shapovalov.html');
	// res.status(201).json(osData);
});
// 	Die Daten sollen per POST‐Request an den Server übermittelt werden
app.post('/', body('email').trim().toLowerCase().isEmail().isLength({min: 10, max: 50}), (req, res) => {
	// und die E‐Mail‐Adresse
	// syntaktisch überprüft werden.
	//
	//erwarten {"email": "....email_adresse..."}
	//wenn email gibt's:
	//einen E mail mit Bestätigungslink senden
	//
	//Bestätigung:
	//beim klicken auf den link => token vergleichen und bestätigen und Bestätigungsseite zeigen oder Fehler
	//
	// check ob express validator irgendeine Fehler gefunden hat
	//
	// Fehler werden im UI ausgegeben.
	const result = validationResult(req);

	if (!result.isEmpty()) {
		return res.status(422).json(result);
	}
	const {email} = matchedData(req);
	//
	emails.forEach((item) => {
		if (item.verified === email) {
			return res.status(422).send('Dieses Email Adresse ist schon registriert');
		}
	});
	//Email mittels DNS Check (MX Eintrag muss vorhanden sein) überprüfen
	const emailDNS = email.split(new RegExp(`@`))[1];

	dns.resolveMx(emailDNS, (err, mxList) => {
		if (err) {
			if (err.code == 'ENODATA' || err.code == 'ENOTFOUND') {
				console.log(err);
				return res.status(422).send('E-mail Adresse ist nicht gefunden, oder ist nicht zustellbar');
			}

			return res.status(422).send(err);
		}

		//

		emailBuffer = email;

		//Bestätigungsmail bastel
		//email versenden
		transporter
			.sendMail({
				from: '"Newsletter Service🎀" <newsletter_shapovalov@ethereal.email>', // sender address
				to: email, // list of receivers
				subject: 'E-mail Verifizierung',
				html: `<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
		<title>Mail mit Bestätigung</title>

		<style>
			* {
				margin: 20;
				padding: 20;
			}

			body {
				display: flex;
				justify-content: center;
				align-items: first baseline;

				font-family: 'Arial', sans-serif;
				background-color: #11304bf7;
			}

			.container {
				text-align: center;
				padding: 20px;
				border-radius: 10px;
				background-color: aliceblue;
				width: 300px;
			}

			a {
				width: 100%;
				padding: 10px;
				border: none;
				border-radius: 5px;
				background-color: var(--primary-color);
				color: #ffffff;
				font-size: 16px;
				cursor: pointer;
				transition: background-color 0.3s;
				text-decoration: none;
				user-select: none;
			}

			a:hover {
				background-color: var(--button-hover-color);
			}

			:root {
				--primary-color: #2c3e50; /* Dark Slate Gray */

				--button-hover-color: #34495e; /* Slightly lighter dark gray */
			}
		</style>
	</head>
	<body>
		<div class="container">
			<a href="http://localhost:7001/submit/?token=${token}">Submit your E-Mail</a>
		</div>
	</body>
</html>


`, // plain text body
			})
			.then((response) => {
				//token behandeln
				tokens.push({email, token});

				writeEmailsToken();
				res.json(response);
				// console.log('Response von Mail Server: \n', response);
			})
			.catch((error) => {
				res.status(400).send(error);
			});
	});
});
//
//__Wenn user auf E-mail bestätigen klickt, Bestätigungsseite versenden
app.get(`/submit/`, (req, res) => {
	let receivedToken = req.query.token;
	let verified_Email;
	if (receivedToken) {
		// token in der Liste suchen
		tokens.forEach((item) => {
			if (item.token === receivedToken ? true : false) {
				verified_Email = item.email;

				emails.push({verified: verified_Email});
				writeCSV(emails);
			}
		});
	}

	// Validierte E‐Mail‐Adressen werden in einer CSV‐Datei gespeichert. Es kann ein NPM‐Modul wie z.B.
	// "csv" verwendet werden.
	csv.stringify();

	//

	res.send(`<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
		<title>Bestätigungsseite</title>

		<style>
			* {
				margin: 20;
				padding: 20;
			}

			body {
			
				display: flex;
				justify-content: center;
				align-items: center;
				height: 90vh;
				font-family: 'Arial', sans-serif;
				background-color: #11304bf7;
			}

			.container {
				text-align: center;
				padding: 20px;
				border-radius: 10px;
				background-color: rgb(67, 251, 110);
				width: 300px;
			}

			:root {
				--primary-color: #2c3e50; /* Dark Slate Gray */
			}
		</style>
	</head>
	<body>
		<div class="container">Email ${verified_Email} ist bestätigt!</div>
	</body>
</html>
`);
});
//_______________________________________________________
// ___________zentrale Fehler Behandlung ________________
//Middleware
//wenn als erster Parameter ein Fehlerobjekt kommt, dass wird diese Middleware ausgeführt
app.use((error, req, res, next) => {
	//wenn schon ein Serverheader gesetzt wurde(zB ein Statuscode oder .send oder .json usw. verwendet ist)
	if (res.headerSent) {
		return next(error);
	}
	res.status(error.errorCode ?? 500);
	res.json({
		message: error.message ?? 'Unknown server error',
	});
});
// _____________________________________________________
app.get('*', (req, res) => {
	res.send('<h1>Nicht gefunden!</h1><br><br><p>Gewünschte Seite nicht gefunden</p>');
});

app.listen(PORT, () => {
	loadEmailsToken();
	// loadEmails();
	readCSV();
	console.log('Server is running with port ', PORT);
});
