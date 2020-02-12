import { Router } from 'express';

const routes = new Router();

routes.get('/', (req, res) => res.json({ title: 'Hello World Fast Feet!' }));

export default routes;
