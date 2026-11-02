// Serialize writes while leaving optimistic rendering to the board store.
export class OperationQueue {
  constructor() {
    this.pending = [];
    this.running = false;
  }

  enqueue(operation) {
    return new Promise((resolve, reject) => {
      this.pending.push({ ...operation, resolve, reject });
      this.drain();
    });
  }

  hasPendingForTask(taskId) {
    return this.pending.some((operation) => operation.taskId === taskId);
  }

  dropPendingForTask(taskId, error) {
    const keep = [];
    this.pending.forEach((operation) => {
      if (operation.taskId === taskId) operation.reject(error);
      else keep.push(operation);
    });
    this.pending = keep;
  }

  async drain() {
    if (this.running) return;
    this.running = true;
    while (this.pending.length) {
      const operation = this.pending.shift();
      try {
        operation.resolve(await operation.run());
      } catch (error) {
        operation.reject(error);
      }
    }
    this.running = false;
  }
}

export const moveOperationQueue = new OperationQueue();
