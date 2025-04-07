type IntervalTask = {
    id: NodeJS.Timeout;
    name: string;
    callback: () => void;
    interval: number;
  };
  
export default class IntervalUtil {
    private tasks: Map<string, IntervalTask> = new Map();
  
    /**
     * 添加定时任务
     * @param name 任务名称（唯一）
     * @param callback 定时执行的函数
     * @param interval 执行间隔（ms）
     */
    add(name: string, intervalInMinutes: number, callback: () => void): void {
      if (this.tasks.has(name)) {
        console.warn(`[IntervalManager] Task "${name}" already exists.`);
        return;
      }
      const intervalInMilliseconds = intervalInMinutes * 60 * 1000;
      const id = setInterval(callback, intervalInMilliseconds);
      this.tasks.set(name, { id, name, callback,interval: intervalInMilliseconds});
      console.log(`[IntervalManager] Task "${name}" started.`);
    }
  
    /**
     * 移除定时任务
     * @param name 任务名称
     */
    remove(name: string): void {
      const task = this.tasks.get(name);
      if (task) {
        clearInterval(task.id);
        this.tasks.delete(name);
        console.log(`[IntervalManager] Task "${name}" removed.`);
      } else {
        console.warn(`[IntervalManager] Task "${name}" not found.`);
      }
    }
  
    /**
     * 获取当前所有任务名
     */
    list(): string[] {
      return Array.from(this.tasks.keys());
    }
  
    /**
     * 检查是否存在某个任务
     */
    has(name: string): boolean {
      return this.tasks.has(name);
    }
  }
  
  