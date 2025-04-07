import { parentPort, workerData } from "worker_threads";
import config from "../common/config/config";
import vosk from "vosk";

// 加载 Vosk 语音识别模型（只加载一次）
const cn_model = new vosk.Model(config.speechRecognition.cn_modelPath);
const en_model = new vosk.Model(config.speechRecognition.en_modelPath);
const models:Map<string,vosk.Model> = new Map();
models.set("zh", cn_model);
models.set("en", en_model);
console.log("Vosk 语音识别模型加载成功");

// 每个用户都有自己的 Recognizer
const userRecognizers = new Map<string, vosk.Recognizer<any>>();

// 监听主线程的音频数据
parentPort!.on("message", async (message) => {
  const action=message.action;
  const data=message.data;
  if(action==="init"){
    if (userRecognizers.has(data.userId)) {
      console.log(`用户 ${data.userId} 的 Recognizer 已经存在`);
      return;
    }else{
      userRecognizers.set(
        data.userId,
        new vosk.Recognizer({
          model:models.get(data.lang)!,
          sampleRate: config.speechRecognition.sampleRate,
        })
      );
      console.log(`创建用户 ${data.userId} 的 Recognizer`);
    }
  }else if(action==='close'){
    userRecognizers.delete(data.userId);
  }else if(action==='newData'){
    const {userId,audioBuffer}=data
    const recognizer = userRecognizers.get(userId);
    if (!recognizer) return;
    const speech = recognizer.acceptWaveform(audioBuffer);
    if (speech) {
      let speechToText = recognizer.result();
      console.log("接收到音频数据：", speechToText.text);
      parentPort!.postMessage({ userId, text: speechToText.text});
    }else{
      parentPort!.postMessage({ userId, text: ""});
    }
}
});
