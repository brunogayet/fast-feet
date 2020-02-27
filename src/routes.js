import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';

import authMiddleware from './app/middlewares/auth';

import RecipientController from './app/controllers/RecipientController';

const routes = new Router();
const upload = multer(multerConfig);

// [Create] Users Route
routes.post('/users', UserController.store);

// [Create] Session Route
routes.post('/sessions', SessionController.store);

// Middleware - Token Authentication (JWT)
routes.use(authMiddleware);

// [Update] Users Route
routes.put('/users', UserController.update);

// [Create] Recipient Route
routes.post('/recipients', RecipientController.store);

// [Update] Recipient Route
routes.put('/recipients', RecipientController.update);

routes.post('/files', upload.single('file'), FileController.store);

export default routes;
