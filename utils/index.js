const randomNumber = (min = 0, max = 999999999) => {
	// Zufallszahl im Bereich 0.00000000000000000001 und 0.9999999999999999999999 erzeugen
	const random = Math.random();

	// Nur eine so hohe Zahl erzeugen, damit man am Schluss noch das MIN dazuzählen kann
	// z.B. min = 10, max = 12, multiplier = 12- 10 + 1 = 3
	// Plus 1 deswegen, da ZZ ja nur bis 0.9999 erzeugt werden, man also in die nächste Ganzhahl
	// kommen muss, damit man später abrundet
	const multiplier = max - min + 1;
	const randomCalculated = random * multiplier;

	// immer abrunden, um eine Zufalls-Ganzzahl zu bekommen
	const randomRounded = Math.floor(randomCalculated);

	// jetzt den Startwert (MIN) noch dazuzählen
	const randomFinal = randomRounded + min;

	// console.log('min', min);
	// console.log('max', max);
	// console.log('random', random);
	// console.log('multiplier', multiplier);
	// console.log('randomCalculated', randomCalculated);
	// console.log('randomRounded', randomRounded);
	// console.log('randomFinal', randomFinal);
	return randomFinal;
};
function randomColor() {
	let red = Math.floor(Math.random() * 256);
	let green = Math.floor(Math.random() * 256);
	let blue = Math.floor(Math.random() * 256);

	let colorMax = 90;

	switch ((red, green, blue)) {
		case red < colorMax:
			red = colorMax;

		case green < colorMax:
			green = colorMax;
		case blue < colorMax:
			blue = colorMax;
		default:
			break;
	}
	return `rgb(${red}, ${green}, ${blue}, 0.38)`;
}
const validateEmail = (email) => {
	const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(String(email).toLowerCase());
};

const getJWT = () => {
	return 'fake';
};

export {randomNumber, getJWT, validateEmail, randomColor};
