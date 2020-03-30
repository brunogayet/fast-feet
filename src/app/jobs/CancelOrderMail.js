import { format, parseISO } from 'date-fns';

import Mail from '../../lib/Mail';

class CancelOrderMail {
  get key() {
    return 'cancelOrderMail';
  }

  async handle({ data }) {
    const {
      id,
      deliveryMan,
      delivery_problem_description,
      created_at,
      canceled_at,
    } = data;

    // Send the cancel email to responsible delivery man
    await Mail.sendMail({
      to: `${deliveryMan.name} <${deliveryMan.email}>`,
      subject: `Order canceled - FastFeet`,
      template: 'cancelOrder',
      context: {
        id,
        delivery_man_name: deliveryMan.name,
        delivery_problem_description,
        created_at: format(parseISO(created_at), 'yyyy-mm-dd H:mm'),
        canceled_at: format(parseISO(canceled_at), 'yyyy-mm-dd H:mm'),
      },
    });
  }
}

export default new CancelOrderMail();
