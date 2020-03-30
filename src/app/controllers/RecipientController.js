import * as Yup from 'yup';

import Recipient from '../models/Recipient';

class RecipientController {
  /**
   * Create Recipient
   */
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      address_street: Yup.string().required(),
      address_number: Yup.number().required(),
      address_additional_details: Yup.string(),
      address_state: Yup.string().required(),
      address_city: Yup.string().required(),
      address_postal_code: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const recipientExists = await Recipient.findOne({
      where: {
        name: req.body.name,
        address_postal_code: req.body.address_postal_code,
        address_number: req.body.address_number,
      },
    });

    if (recipientExists) {
      return res.status(400).json({ error: 'Recipient already exists' });
    }

    const {
      id,
      name,
      address_street,
      address_number,
      address_additional_details,
      address_state,
      address_city,
      address_postal_code,
    } = await Recipient.create(req.body);

    return res.json({
      id,
      name,
      address_street,
      address_number,
      address_additional_details,
      address_state,
      address_city,
      address_postal_code,
    });
  }

  /**
   * Update Recipient
   */
  async update(req, res) {
    const schema = Yup.object().shape({
      id: Yup.number().required(),
      name: Yup.string(),
      address_street: Yup.string(),
      address_number: Yup.number(),
      address_additional_details: Yup.string(),
      address_state: Yup.string(),
      address_city: Yup.string(),
      address_postal_code: Yup.string(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { id, name } = req.body;

    const recipient = await Recipient.findByPk(id);

    if (name && name !== recipient.name) {
      const recipientExists = await Recipient.findOne({ where: { name } });

      if (recipientExists) {
        return res.status(400).json({ error: 'Recipient already exists' });
      }
    }

    const {
      address_street,
      address_number,
      address_additional_details,
      address_state,
      address_city,
      address_postal_code,
    } = await recipient.update(req.body);

    return res.json({
      id,
      name,
      address_street,
      address_number,
      address_additional_details,
      address_state,
      address_city,
      address_postal_code,
    });
  }
}

export default new RecipientController();
