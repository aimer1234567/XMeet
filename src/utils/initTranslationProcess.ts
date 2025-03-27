import { exec } from "child_process";
export default function initTranslationProcess() {
    const command =
      "& .\\py_script\\venv\\Scripts\\activate; python .\\py_script\\openapi.py";
    const translationProcess = exec(command, { shell: "powershell.exe" });
    translationProcess.stdout!.on("data", (data) => {
      console.log(`Python 代码输出：${data}`);
    });
    translationProcess.on("exit", (code) => {
      if (code === 0) {
        console.log("Python 代码执行成功！");
      } else {
        console.error(`Python 代码执行失败，退出码: ${code}`);
      }
    });
    // 监听 Node.js 进程的退出事件
    const cleanup = () => {
      console.log("Node.js 进程退出，正在终止 Python 子进程...");
      translationProcess.kill();
      process.exit();
    };
  
    process.on("exit", cleanup);
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
    process.on("uncaughtException", cleanup);
  }