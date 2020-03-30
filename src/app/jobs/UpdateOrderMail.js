import { format, parseISO } from 'date-fns';

import Mail from '../../lib/Mail';

class UpdateOrderMail {
  get key() {
    return 'updateOrderMail';
  }

  async handle({ data }) {
    const {
      id,
      deliveryMan,
      recipient,
      product,
      created_at,
      updated_at,
    } = data;

    // Send the update email to responsible delivery man
    await Mail.sendMail({
      to: `${deliveryMan.name} <${deliveryMan.email}>`,
      subject: 'An order has been updated - FastFeet',
      template: 'updateOrder',
      context: {
        id,
        delivery_man_name: deliveryMan.name,
        product,
        address_street: recipient.address_street,
        address_number: recipient.address_number,
        address_postal_code: recipient.address_postal_code,
        address_city: recipient.address_city,
        address_state: recipient.address_state,
        created_at: format(parseISO(created_at), 'yyyy-mm-dd H:mm'),
        updated_at: format(parseISO(updated_at), 'yyyy-mm-dd H:mm'),
      },
    });
  }
}

export default new UpdateOrderMail();
