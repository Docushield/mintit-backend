// Importing module
import express from 'express';
import * as bodyParser from "body-parser";
import { loginRouter, collectionRouter } from './routes';

const app = express();
const PORT:Number=3000;

app.use(bodyParser.json());

app.use('/api/auth', loginRouter);
app.use('/api/collections', collectionRouter);

// Handling GET / Request
app.get('/', (req, res) => {
	res.send('Welcome to typescript backend!');
})

// Server setup
app.listen(PORT,() => {
	console.log('The application is listening '
		+ 'on port http://localhost:'+PORT);
})

