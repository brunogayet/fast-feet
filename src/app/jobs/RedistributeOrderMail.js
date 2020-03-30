import { format, parseISO } from 'date-fns';

import Mail from '../../lib/Mail';

class RedistributeOrderMail {
  get key() {
    return 'redistributeOrderMail';
  }

  async handle({ data }) {
    const { id, deliveryMan, created_at, updated_at } = data;

    // Send the redistribution email to the old delivery man
    await Mail.sendMail({
      to: `${deliveryMan.name} <${deliveryMan.email}>`,
      subject: `Order redistributed - FastFeet`,
      template: 'redistributeOrder',
      context: {
        id,
        delivery_man_name: deliveryMan.name,
        created_at: format(parseISO(created_at), 'yyyy-mm-dd H:mm'),
        redistributed_at: format(parseISO(updated_at), 'yyyy-mm-dd H:mm'),
      },
    });
  }
}

export default new RedistributeOrderMail();
