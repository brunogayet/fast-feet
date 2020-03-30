import * as Yup from 'yup';

import DeliveryProblem from '../models/DeliveryProblem';
import Order from '../models/Order';
import DeliveryMan from '../models/DeliveryMan';
import Recipient from '../models/Recipient';

import CancelOrderMail from '../jobs/CancelOrderMail';

import Queue from '../../lib/Queue';

class DeliveryProblemController {
  async index(req, res) {
    const deliveryProblems = await DeliveryProblem.findAll({
      attributes: ['id', 'description', 'createdAt', 'updatedAt'],
      include: {
        model: Order,
        as: 'order',
      },
    });

    return res.json(deliveryProblems);
  }

  async show(req, res) {
    const deliveryProblem = await DeliveryProblem.findAll({
      where: { delivery_id: req.params.delivery_id },
      attributes: ['id', 'description', 'createdAt', 'updatedAt'],
    });

    return res.json(deliveryProblem);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      description: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { delivery_id } = req.params;

    const order = await Order.findByPk(delivery_id);

    // Checks if the order does not exist
    if (!order) {
      return res.status(400).json({ error: 'The order does not exist' });
    }

    // Checks if the order has already been picked up by the delivery man
    if (!order.start_date) {
      return res.status(400).json({
        error: 'The order has not yet been picked up by the delivery man',
      });
    }

    const deliveryProblem = await DeliveryProblem.create({
      delivery_id,
      description: req.body.description,
    });

    return res.json(deliveryProblem);
  }

  async delete(req, res) {
    const deliveryProblem = await DeliveryProblem.findByPk(req.params.id, {
      attributes: ['id', 'description', 'createdAt', 'updatedAt'],
      include: [
        {
          attributes: [
            'id',
            'product',
            'start_date',
            'createdAt',
            'updatedAt',
            'canceled_at',
          ],
          model: Order,
          as: 'order',
          include: [
            {
              model: DeliveryMan,
              as: 'delivery_man',
              attributes: ['id', 'name', 'email'],
            },
            {
              model: Recipient,
              as: 'recipient',
              attributes: [
                'id',
                'name',
                'address_street',
                'address_number',
                'address_additional_details',
                'address_city',
                'address_state',
                'address_postal_code',
              ],
            },
          ],
        },
      ],
    });

    if (!deliveryProblem) {
      return res
        .status(400)
        .json({ error: 'The problem ID provided does not exist' });
    }

    // Checks if the order has already been delivered
    if (deliveryProblem.order.end_date) {
      return res.status(400).json({
        error: 'The order cannot be canceled, it has already been delivered',
      });
    }

    // Checks if the order has already been canceled
    if (deliveryProblem.order.canceled_at) {
      return res.status(400).json({
        error: 'The order has already been canceled',
      });
    }

    const { order } = deliveryProblem;

    const {
      id,
      delivery_man: deliveryMan,
      createdAt: created_at,
      canceled_at,
    } = await order.update({
      canceled_at: new Date(),
    });

    // Send removed email alert
    await Queue.add(CancelOrderMail.key, {
      id,
      deliveryMan,
      delivery_problem_description: deliveryProblem.description,
      created_at,
      canceled_at,
    });

    return res.json({
      id: deliveryProblem.id,
      description: deliveryProblem.description,
      order,
    });
  }
}

export default new DeliveryProblemController();
