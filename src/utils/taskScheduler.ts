import { ErrorEnum } from "../common/enums/errorEnum";
import MyError from "../common/myError";

type TaskFunction = () => void | Promise<void>;

interface TaskEntry {
  name: string;
  interval: number;
  callback: TaskFunction;
  timerId?: NodeJS.Timeout;
  stopped: boolean;
}

class TaskScheduler {
  private tasks: Map<string, TaskEntry> = new Map();

  /**
   * 添加一个定时任务（上一次执行完后等待 interval 毫秒再执行）
   * @param name 唯一任务名
   * @param interval 执行周期（单位：毫秒）
   * @param callback 任务函数
   */
  addTask(name: string, interval: number, callback: TaskFunction): void {
    if (this.tasks.has(name)) {
      throw new MyError(ErrorEnum.TaskExist)
    }
    interval= interval * 60 * 1000; // 转换为毫秒
    const task: TaskEntry = {
      name,
      interval,
      callback,
      stopped: false,
    };
    //链式定时器,任务之间不会重叠
    const run = async () => {
      if (task.stopped) return;
      try {
        await callback();
      } catch (err) {
        console.error(`[TaskScheduler] Error in task "${name}":`, err);
      }
      if (!task.stopped) {
        task.timerId = setTimeout(run, task.interval);
      }
    };

    task.timerId = setTimeout(run, interval);
    this.tasks.set(name, task);
    console.log(`[TaskScheduler] Started task "${name}" (interval: ${interval} ms)`);
  }

  /**
   * 移除并停止任务
   */
  removeTask(name: string): void {
    const task = this.tasks.get(name);
    if (task) {
      task.stopped = true;
      if (task.timerId) {
        clearTimeout(task.timerId);
      }
      this.tasks.delete(name);
      console.log(`[TaskScheduler] Removed task "${name}"`);
    }
  }

  /**
   * 停止所有任务
   */
  stopAll(): void {
    for (const [name, task] of this.tasks) {
      task.stopped = true;
      if (task.timerId) {
        clearTimeout(task.timerId);
      }
      console.log(`[TaskScheduler] Stopped task "${name}"`);
    }
    this.tasks.clear();
  }

  /**
   * 检查任务是否存在
   */
  hasTask(name: string): boolean {
    return this.tasks.has(name);
  }

  /**
   * 获取所有任务名
   */
  listTasks(): string[] {
    return Array.from(this.tasks.keys());
  }
}

const taskScheduler = new TaskScheduler();
export { taskScheduler };