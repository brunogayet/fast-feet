import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import RecipientController from './app/controllers/RecipientController';
import DeliveryManController from './app/controllers/DeliveryManController';
import OrderController from './app/controllers/OrderController';
import PickUpController from './app/controllers/PickUpController';
import DeliveryController from './app/controllers/DeliveryController';
import DeliveryProblemController from './app/controllers/DeliveryProblemController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();
const upload = multer(multerConfig);

/**
 * Open Routes
 * Any user can access the routes below
 */

// [Create] Users Route
routes.post('/users', UserController.store);

// [Create] Session Route
routes.post('/sessions', SessionController.store);

/**
 * Middleware - Token Authentication (JWT)
 * Just the administrator user has access to the routes below
 */
routes.use(authMiddleware);

/**
 * User Route
 */
// [Update] Users Route - In this method, editing is only allowed for the logged in user (provided by userId - JWT)
routes.put('/users', UserController.update);

/**
 * Recipient Routes
 */
// [Index]
routes.get('/recipients', RecipientController.index);
// [Create]
routes.post('/recipients', RecipientController.store);
// [Update]
routes.put('/recipients', RecipientController.update);

/**
 * File Routes
 */
// [Create]
routes.post('/files', upload.single('file'), FileController.store);

/**
 * Delivery Man Routes
 */
// [Index]
routes.get('/deliverymen', DeliveryManController.index);
// [Create]
routes.post('/deliverymen', DeliveryManController.store);
// [Update]
routes.put('/deliverymen/:id', DeliveryManController.update);
// [Delete]
routes.delete('/deliverymen/:id', DeliveryManController.delete);

/**
 * Order Routes
 */
// [Index]
routes.get('/orders', OrderController.index);
// [Create]
routes.post('/orders', OrderController.store);
// [Update]
routes.put('/orders/:id', OrderController.update);
// [Delete]
routes.delete('/orders/:id', OrderController.delete);

/**
 * Pick up Routes
 */
// [Create] (start delivery)
routes.post('/pickups', PickUpController.store);

/**
 * Delivery Routes
 */
// [Index]
routes.get('/deliveryman/:id/deliveries', DeliveryController.index);
// [Create] (end delivery)
routes.post('/deliveryman/deliveries', DeliveryController.store);

/**
 * Delivery Problem Routes
 */
// [Index]
routes.get('/delivery/problems', DeliveryProblemController.index);
// [Show]
routes.get('/delivery/:delivery_id/problems', DeliveryProblemController.show);
// [Create]
routes.post('/delivery/:delivery_id/problems', DeliveryProblemController.store);
// [Delete]
routes.delete('/problem/:id/cancel-delivery', DeliveryProblemController.delete);

export default routes;
