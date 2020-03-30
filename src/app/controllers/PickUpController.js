import * as Yup from 'yup';
import { Op } from 'sequelize';
import {
  startOfDay,
  endOfDay,
  parseISO,
  isWithinInterval,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
} from 'date-fns';

import Order from '../models/Order';
import DeliveryMan from '../models/DeliveryMan';
import Recipient from '../models/Recipient';

class PickUpController {
  async store(req, res) {
    const schema = Yup.object().shape({
      id: Yup.number().required(),
      start_date: Yup.date().required(),
      delivery_man_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { id, delivery_man_id } = req.body;

    const start_date = parseISO(req.body.start_date);

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
      ],
    });

    if (!order) {
      return res.status(400).json({ error: 'The Order does not exist' });
    }

    // Checks if the order has already been picked up
    if (order.start_date) {
      return res
        .status(400)
        .json({ error: 'The order has already been picked up' });
    }

    // Checks if the registered delivery man is the same as that provided in the request
    if (order.delivery_man.id !== delivery_man_id) {
      return res.status(400).json({
        error: 'The order is not available for the provided delivery man',
      });
    }

    // FIXME: The client's timezone isn't being considered
    const checkPickUpAvailable = isWithinInterval(start_date, {
      start: setHours(
        setMinutes(setSeconds(setMilliseconds(start_date, 0), 0), 0),
        8
      ),
      end: setHours(
        setMinutes(setSeconds(setMilliseconds(start_date, 999), 59), 0),
        18
      ),
    });

    // Checks if the picked up is between 8a.m. to 6p.m
    if (!checkPickUpAvailable) {
      return res
        .status(400)
        .json({ error: 'You can only pick up your order from 8a.m to 6p.m' });
    }

    // Count the amount of picks up per delivery man per day
    const amount = await Order.count({
      where: {
        delivery_man_id,
        start_date: {
          [Op.between]: [startOfDay(start_date), endOfDay(start_date)],
        },
      },
    });

    // Checks if the delivery man has picked up more than 5 orders per day
    if (amount >= 5) {
      return res.status(400).json({
        error:
          'The Delivery man has reached the maximum number of pick ups per day',
      });
    }

    const { product, delivery_man, recipient } = await order.update(req.body);

    return res.json({
      id,
      product,
      start_date: req.body.start_date,
      recipient,
      delivery_man,
    });
  }
}

export default new PickUpController();
