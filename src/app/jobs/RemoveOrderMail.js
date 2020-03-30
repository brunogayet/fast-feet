import { format, parseISO } from 'date-fns';

import Mail from '../../lib/Mail';

class RemoveOrderMail {
  get key() {
    return 'removeOrderMail';
  }

  async handle({ data }) {
    const { id, deliveryMan, created_at } = data;

    // Send the remove email to responsible delivery man
    await Mail.sendMail({
      to: `${deliveryMan.name} <${deliveryMan.email}>`,
      subject: `Order removed - FastFeet`,
      template: 'removeOrder',
      context: {
        id,
        delivery_man_name: deliveryMan.name,
        created_at: format(parseISO(created_at), 'yyyy-mm-dd H:mm'),
        removed_at: format(new Date(), 'yyyy-mm-dd H:mm'),
      },
    });
  }
}

export default new RemoveOrderMail();
