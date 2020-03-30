import * as Yup from 'yup';

import Order from '../models/Order';
import Recipient from '../models/Recipient';
import DeliveryMan from '../models/DeliveryMan';
import File from '../models/File';

import SendOrderMail from '../jobs/SendOrderMail';
import UpdateOrderMail from '../jobs/UpdateOrderMail';
import RedistributeOrderMail from '../jobs/RedistributeOrderMail';
import RemoveOrderMail from '../jobs/RemoveOrderMail';

import Queue from '../../lib/Queue';

class OrderController {
  async index(req, res) {
    const orders = await Order.findAll({
      attributes: ['id', 'product', 'start_date', 'end_date', 'canceled_at'],
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
    return res.json(orders);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      product: Yup.string().required(),
      recipient_id: Yup.number().required(),
      delivery_man_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { product, recipient_id, delivery_man_id } = req.body;

    // Checks if Recipient exists
    const recipient = await Recipient.findByPk(recipient_id);

    if (!recipient) {
      return res.status(400).json({ error: 'The Recipient does not exist' });
    }

    // Checks if Delivery man exists
    const deliveryMan = await DeliveryMan.findByPk(delivery_man_id);

    if (!deliveryMan) {
      return res.status(400).json({ error: 'The Delivery man does not exist' });
    }

    const { id, createdAt: created_at } = await Order.create({
      product,
      recipient_id,
      delivery_man_id,
    });

    await Queue.add(SendOrderMail.key, {
      id,
      deliveryMan,
      recipient,
      product,
      created_at,
    });

    return res.json({
      id,
      product,
      recipient_id,
      delivery_man_id,
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape(
      {
        product: Yup.string().when(['recipient_id', 'delivery_man_id'], {
          is: (recipient_id, delivery_man_id) =>
            !recipient_id && !delivery_man_id,
          then: Yup.string().required(),
        }),
        recipient_id: Yup.number().when(['product', 'delivery_man_id'], {
          is: (product, delivery_man_id) => !product && !delivery_man_id,
          then: Yup.number().required(),
        }),
        delivery_man_id: Yup.number().when(['recipient_id', 'product'], {
          is: (recipient_id, product) => !recipient_id && !product,
          then: Yup.number().required(),
        }),
      },
      [
        ['product', 'recipient_id'],
        ['product', 'delivery_man_id'],
        ['recipient_id', 'delivery_man_id'],
      ]
    );

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const order = await Order.findByPk(req.params.id, {
      attributes: [
        'id',
        'product',
        'start_date',
        'end_date',
        'createdAt',
        'canceled_at',
      ],
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
      ],
    });

    // Checks if the order does not exist
    if (!order) {
      return res.status(400).json({ error: 'The order does not exist' });
    }

    // Checks if the order has already been delivered
    if (order.end_date) {
      return res
        .status(400)
        .json({ error: 'The order has already been delivered' });
    }

    // Checks if the order has already been picked up by the delivery man
    if (order.start_date) {
      return res.status(400).json({
        error: 'The order has already been picked up by the delivery man',
      });
    }

    const { recipient_id, delivery_man_id } = req.body;

    // The default value is the one registered in the database
    let { recipient, delivery_man: deliveryMan } = order;

    if (recipient_id) {
      if (recipient_id !== order.recipient_id) {
        // Checks if recipient exists and override the recipient variable with the new value
        recipient = await Recipient.findByPk(recipient_id);

        if (!recipient) {
          return res
            .status(400)
            .json({ error: 'The Recipient does not exist' });
        }
      }
    }

    let sameDeliveryMan = true;

    if (delivery_man_id) {
      if (delivery_man_id !== order.delivery_man.id) {
        // Checks if delivery man exists and override the deliveryMan variable with the new value
        deliveryMan = await DeliveryMan.findByPk(delivery_man_id);

        if (!deliveryMan) {
          return res
            .status(400)
            .json({ error: 'The Delivery man does not exist' });
        }

        // Set false for sameDeliveryMan variable
        sameDeliveryMan = false;
      }
    }

    // Save the old or current Delivery man
    const oldDeliveryMan = order.delivery_man;

    const {
      id,
      product,
      createdAt: created_at,
      updatedAt: updated_at,
    } = await order.update(req.body);

    if (sameDeliveryMan) {
      // Is the same delivery man, just send the update email
      await Queue.add(UpdateOrderMail.key, {
        id,
        deliveryMan,
        recipient,
        product,
        created_at,
        updated_at,
      });
    } else {
      // First, Send redistributed email alert to the old delivery man
      await Queue.add(RedistributeOrderMail.key, {
        id,
        deliveryMan: oldDeliveryMan,
        created_at,
        updated_at,
      });

      // Then, send the email to the new delivery man
      await Queue.add(SendOrderMail.key, {
        id,
        deliveryMan,
        recipient,
        product,
        created_at,
      });
    }

    return res.json({
      id,
      product,
      recipient_id,
      delivery_man_id,
    });
  }

  async delete(req, res) {
    const order = await Order.findByPk(req.params.id, {
      attributes: ['id', 'start_date', 'end_date', 'createdAt'],
      include: [
        {
          model: DeliveryMan,
          as: 'delivery_man',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!order) {
      return res.status(400).json({ error: 'The order does not exist' });
    }

    // Checks if the order has already been delivered
    if (order.end_date) {
      return res
        .status(400)
        .json({ error: 'The order has already been delivered' });
    }

    // Checks if the order has already been picked up by the delivery man
    if (order.start_date) {
      return res.status(400).json({
        error: 'The order has already been picked up by the delivery man',
      });
    }

    const { id, delivery_man: deliveryMan, createdAt: created_at } = order;

    // Send removed email alert
    await Queue.add(RemoveOrderMail.key, {
      id,
      deliveryMan,
      created_at,
    });

    // Delete the order
    await order.destroy();

    return res.json();
  }
}

export default new OrderController();
