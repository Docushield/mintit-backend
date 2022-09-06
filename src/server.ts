// Importing module
import express from 'express';
import cors from 'cors';
import * as bodyParser from "body-parser";
import { loginRouter, collectionRouter } from './routes';

const app = express();
const PORT:Number=8080;

// TODO: Update to env variables with real server hosts
const allowedOrigins = ['http://localhost:3000'];
const corsOptions: cors.CorsOptions = {
  origin: allowedOrigins
};

app.use(cors(corsOptions));
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

