import * as Yup from 'yup';
import { Op } from 'sequelize';

import DeliveryMan from '../models/DeliveryMan';
import File from '../models/File';

class DeliveryManController {
  /**
   * List Delivery Men
   */
  async index(req, res) {
    let where = {};

    // If query parameter '?name=' is passed, then use iLike operator (case insensitive)
    if (req.query.name) {
      where = {
        name: {
          [Op.iLike]: `%${req.query.name}%`,
        },
      };
    }

    const deliveryMen = await DeliveryMan.findAll(
      {
        where,
      },
      {
        attributes: ['id', 'name', 'email'],
        include: [
          {
            model: File,
            as: 'avatar',
            attributes: ['id', 'name', 'path', 'url'],
          },
        ],
      }
    );
    return res.json(deliveryMen);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      avatar_id: Yup.number(),
    });

    // Checks if schema is valid
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const deliveryManExists = await DeliveryMan.findOne({
      where: { email: req.body.email },
    });

    // Checks if the email already exists
    if (deliveryManExists) {
      return res.status(400).json({ error: 'Delivery man already exists ' });
    }

    const { id, name, email } = await DeliveryMan.create(req.body);

    return res.json({
      id,
      name,
      email,
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      avatar_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails ' });
    }

    const deliveryMan = await DeliveryMan.findByPk(req.params.id);

    const { email, avatar_id } = req.body;

    // Checks if the Delivery man does not exist
    if (!deliveryMan) {
      return res.status(400).json({ error: 'The Delivery man does not exist' });
    }

    // Checks if email was changed and if it already exists
    if (email && email !== deliveryMan.email) {
      const deliveryManExists = await DeliveryMan.findOne({
        where: { email },
      });

      if (deliveryManExists) {
        return res
          .status(400)
          .json({ error: 'The Delivery man already exists' });
      }
    }

    if (avatar_id && avatar_id !== deliveryMan.avatar_id) {
      const fileExists = await File.findByPk(avatar_id);

      if (!fileExists) {
        return res.status(400).json({ error: "The Avatar doesn't exist" });
      }
    }

    const { id, name } = await deliveryMan.update(req.body);

    return res.json({
      id,
      name,
      email,
    });
  }

  async delete(req, res) {
    const deliveryMan = await DeliveryMan.findByPk(req.params.id);

    // Checks if the Delivery man exist
    if (!deliveryMan) {
      return res.status(400).json({ error: "The Delivery man doesn't exist" });
    }

    await deliveryMan.destroy();

    return res.json();
  }
}

export default new DeliveryManController();
