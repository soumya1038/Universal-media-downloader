import config from '../config/index.js';

class InMemoryQueue {
  constructor(name, concurrency = 1) {
    this.name = name;
    this.concurrency = concurrency;
    this.queue = [];
    this.activeCount = 0;
    this.processor = null;
  }

  process(processorFunction) {
    this.processor = processorFunction;
  }

  async add(jobName, data) {
    const job = {
      id: data.jobId,
      name: jobName,
      data: data,
    };
    this.queue.push(job);
    console.log(`[Queue] Added job ${job.id} to ${this.name} queue`);
    this._checkQueue();
    return job;
  }

  async _checkQueue() {
    if (this.activeCount >= this.concurrency || this.queue.length === 0 || !this.processor) {
      return;
    }

    this.activeCount++;
    const job = this.queue.shift();

    try {
      await this.processor(job);
      console.log(`[Queue] Job ${job.id} completed successfully.`);
    } catch (err) {
      console.error(`[Queue] Job ${job.id} failed:`, err.message);
    } finally {
      this.activeCount--;
      this._checkQueue();
    }
  }
}

export const downloadQueue = new InMemoryQueue('download', config.limits.maxConcurrentDownloads);

export default downloadQueue;
