// Importing module
import express from 'express';
import { loginRouter } from './routes';

const app = express();
const PORT:Number=3000;

app.use('/api/auth', express.json());
app.use('/api/auth', loginRouter);

// Handling GET / Request
app.get('/', (req, res) => {
	res.send('Welcome to typescript backend!');
})

// Server setup
app.listen(PORT,() => {
	console.log('The application is listening '
		+ 'on port http://localhost:'+PORT);
})

