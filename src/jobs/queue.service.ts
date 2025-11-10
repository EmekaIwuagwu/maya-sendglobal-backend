import { Queue, Worker, Job } from 'bullmq';
import { redis } from '../config/redis';
import { logger } from '../config/logger';
import { JobData } from '../types';

// Queue names
export const QUEUE_NAMES = {
  TRANSACTIONS: 'transactions',
  NOTIFICATIONS: 'notifications',
  EMAILS: 'emails',
  SMS: 'sms',
  KYC: 'kyc',
  REPORTS: 'reports',
} as const;

export class QueueService {
  private static queues: Map<string, Queue> = new Map();
  private static workers: Map<string, Worker> = new Map();

  /**
   * Get or create queue
   */
  static getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      const queue = new Queue(name, {
        connection: redis,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: {
            count: 100,
            age: 24 * 3600, // 24 hours
          },
          removeOnFail: {
            count: 1000,
            age: 7 * 24 * 3600, // 7 days
          },
        },
      });

      this.queues.set(name, queue);
      logger.info(`Queue created: ${name}`);
    }

    return this.queues.get(name)!;
  }

  /**
   * Add job to queue
   */
  static async addJob(queueName: string, data: JobData) {
    const queue = this.getQueue(queueName);

    const job = await queue.add(data.type, data.data, {
      priority: data.priority,
      attempts: data.attempts,
    });

    logger.info(`Job added to ${queueName}: ${job.id} (${data.type})`);

    return job;
  }

  /**
   * Create worker for queue
   */
  static createWorker(
    queueName: string,
    processor: (job: Job) => Promise<any>
  ): Worker {
    if (this.workers.has(queueName)) {
      return this.workers.get(queueName)!;
    }

    const worker = new Worker(queueName, processor, {
      connection: redis,
      concurrency: 10,
    });

    worker.on('completed', (job) => {
      logger.info(`Job completed: ${job.id} from ${queueName}`);
    });

    worker.on('failed', (job, err) => {
      logger.error(`Job failed: ${job?.id} from ${queueName}`, err);
    });

    worker.on('error', (err) => {
      logger.error(`Worker error in ${queueName}:`, err);
    });

    this.workers.set(queueName, worker);
    logger.info(`Worker created for queue: ${queueName}`);

    return worker;
  }

  /**
   * Close all queues and workers
   */
  static async close() {
    logger.info('Closing all queues and workers...');

    for (const worker of this.workers.values()) {
      await worker.close();
    }

    for (const queue of this.queues.values()) {
      await queue.close();
    }

    this.workers.clear();
    this.queues.clear();

    logger.info('All queues and workers closed');
  }

  /**
   * Get queue stats
   */
  static async getQueueStats(queueName: string) {
    const queue = this.getQueue(queueName);

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }
}

export default QueueService;
