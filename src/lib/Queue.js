import Bee from 'bee-queue';

import SendOrderMail from '../app/jobs/SendOrderMail';
import UpdateOrderMail from '../app/jobs/UpdateOrderMail';
import RedistributeOrderMail from '../app/jobs/RedistributeOrderMail';
import RemoveOrderMail from '../app/jobs/RemoveOrderMail';
import CancelOrderMail from '../app/jobs/CancelOrderMail';

import redisConfig from '../config/redis';

const jobs = [
  SendOrderMail,
  UpdateOrderMail,
  RedistributeOrderMail,
  RemoveOrderMail,
  CancelOrderMail,
];

class Queue {
  constructor() {
    this.queues = {};

    this.init();
  }

  init() {
    jobs.forEach(({ key, handle }) => {
      this.queues[key] = {
        bee: new Bee(key, {
          redis: redisConfig,
        }),
        handle,
      };
    });
  }

  add(queue, job) {
    return this.queues[queue].bee.createJob(job).save();
  }

  processQueue() {
    jobs.forEach(job => {
      const { bee, handle } = this.queues[job.key];

      bee.on('failed', this.handleFailure).process(handle);
    });
  }

  handleFailure(job, err) {
    console.log(`Queue ${job.queue.name}: FAIELD`, err);
  }
}

export default new Queue();
