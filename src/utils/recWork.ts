import { parentPort, workerData } from "worker_threads";
import config from "../common/config/config";
import vosk from "vosk";

// 加载 Vosk 语音识别模型（只加载一次）
const model = new vosk.Model(config.speechRecognition.modelPath);
console.log("Vosk 语音识别模型加载成功");

// 每个用户都有自己的 Recognizer
const userRecognizers = new Map<string, vosk.Recognizer<any>>();

// 监听主线程的音频数据
parentPort!.on("message", async (message) => {
  const { userId, audioBuffer } = message;
  if (!userRecognizers.has(userId)) {
    userRecognizers.set(
      userId,
      new vosk.Recognizer({
        model,
        sampleRate: config.speechRecognition.sampleRate,
      })
    );
    console.log(`创建用户 ${userId} 的 Recognizer`);
  }
  const recognizer = userRecognizers.get(userId);
  if (!recognizer) return;
  const speech = recognizer.acceptWaveform(audioBuffer);
  if (speech) {
    let speechToText = recognizer.result();
    console.log("接收到音频数据：", speechToText.text);
    parentPort?.postMessage({ userId, text: speechToText.text});
  }else{
    parentPort?.postMessage({ userId, text: ""});
  }
});
