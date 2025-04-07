import { Worker } from "worker_threads";
export class WorkerTaskQueue<T> {
  private taskQueue: T[] = [];
  private worker!: Worker;
  // 设置新 worker（例如当原来的 worker 崩溃后重启一个新的）
  setWorker(newWorker: Worker) {
    this.worker = newWorker;
    this._dispatchNextTask(); // 重新尝试执行当前任务
  }
  // 添加任务并调度执行
  addTaskToQueue(task: T) {
    this.taskQueue.push(task);
    if (this.taskQueue.length === 1) {
      this._dispatchNextTask();
    }
  }

  // 当前任务完成后调度下一个
  handleNextTaskDone() {
    this.taskQueue.shift(); // 移除当前任务
    this._dispatchNextTask(); // 执行下一个任务
  }

  // 实际调度任务（只发消息，不做移除）
  private _dispatchNextTask() {
    if (this.taskQueue.length > 0) {
      const task = this.taskQueue[0]; // 队首任务
      this.worker.postMessage(task);
    }
  }
}
