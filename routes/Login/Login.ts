import express, { Request, Response } from 'express';
import { login, logout } from '../../controllers';

export const router = express.Router({
    strict: true
});

router.post('/', (req: Request, res: Response) => {
    login(req, res);
});

router.delete('/', (req: Request, res: Response) => {
    logout(req, res);
});
