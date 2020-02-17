import { Router } from 'express';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';

import authMiddleware from './app/middlewares/auth';

import RecipientController from './app/controllers/RecipientController';

const routes = new Router();

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

export default routes;
