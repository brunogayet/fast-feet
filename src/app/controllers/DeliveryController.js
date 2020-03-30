import * as Yup from 'yup';
import { Op } from 'sequelize';

import Order from '../models/Order';
import DeliveryMan from '../models/DeliveryMan';
import Recipient from '../models/Recipient';
import File from '../models/File';

class DeliveryController {
  async index(req, res) {
    const schema = Yup.object().shape({
      delivered: Yup.boolean(),
    });

    if (!(await schema.isValid(req.query))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { id } = req.params;

    // By default, the route returns orders that have not been delivered or canceled
    let where = {
      delivery_man_id: id,
      end_date: null,
      canceled_at: null,
    };

    /**
     * Checks if the delivered parameter is enabled to filter only delivered orders
     * ps: The toLowerCase function was used because the request can provide a capitalized string 'TRUE' (causing an error)
     */
    if (req.query.delivered && JSON.parse(req.query.delivered.toLowerCase())) {
      where = {
        delivery_man_id: id,
        end_date: {
          [Op.not]: null,
        },
      };
    }

    const delivery = await Order.findAll(
      {
        where,
      },
      {
        attributes: ['id', 'product', 'start_date'],
        include: [
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
          {
            model: DeliveryMan,
            as: 'delivery_man',
            attributes: ['id', 'name', 'email'],
          },
          {
            model: File,
            as: 'signature',
            attributes: ['id', 'name', 'path', 'url'],
          },
        ],
      }
    );

    return res.json(delivery);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      id: Yup.number().required(),
      end_date: Yup.date().required(),
      delivery_man_id: Yup.number().required(),
      signature_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { id, delivery_man_id, signature_id } = req.body;

    const order = await Order.findByPk(id, {
      include: [
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
        {
          model: DeliveryMan,
          as: 'delivery_man',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: File,
          as: 'signature',
          attributes: ['id', 'name', 'path', 'url'],
        },
      ],
    });

    if (!order) {
      return res.status(400).json({ error: 'The Order does not exist' });
    }

    // Checks if the order has already been delivered
    if (order.end_date) {
      return res
        .status(400)
        .json({ error: 'The order has already been delivered' });
    }

    // Checks if the registered delivery man is the same as that provided in the request
    if (order.delivery_man.id !== delivery_man_id) {
      return res.status(400).json({
        error: 'The order is not available for the provided delivery man',
      });
    }

    const signature = await File.findByPk(signature_id);

    // Checks if the signature image exists
    if (!signature) {
      return res
        .status(400)
        .json({ error: 'The signature image does not exist' });
    }

    const { product, delivery_man, recipient } = await order.update(req.body);

    return res.json({
      id,
      product,
      end_date: req.body.end_date,
      recipient,
      delivery_man,
    });
  }
}

export default new DeliveryController();
