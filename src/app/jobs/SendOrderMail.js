import { format, parseISO } from 'date-fns';

import Mail from '../../lib/Mail';

class SendOrderMail {
  get key() {
    return 'sendOrderMail';
  }

  async handle({ data }) {
    const { id, deliveryMan, recipient, product, created_at } = data;

    // Send the email to responsible delivery man
    await Mail.sendMail({
      to: `${deliveryMan.name} <${deliveryMan.email}>`,
      subject: 'New order available for pick up - FastFeet',
      template: 'sendOrder',
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
      },
    });
  }
}

export default new SendOrderMail();
