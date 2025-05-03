import config from "../common/config/config";
import { PassThrough, Readable, ReadableOptions } from "stream";
import ffmpeg from "fluent-ffmpeg";
import axios from "axios";
import { Worker } from "worker_threads";
import path from "path";
import { roomStatusManager } from "../services/roomStatusManager";
import userStatusManager from "../services/userStatusManager";
import meetSpeechDao from "../dao/MeetSpeechDao";
import MeetSpeech from "../models/entity/MeetSpeech";
import { WorkerTaskQueue } from "../utils/workerTaskQueue";
class AudioStream extends Readable {
  chunks: Buffer[];
  reading: boolean;
  constructor(options: ReadableOptions, chunks: Array<any>) {
    super(options);
    this.chunks = chunks;
    this.reading = false;
  }

  _read() {
    if (this.chunks.length > 0) {
      const chunk = this.chunks.shift();
      this.push(chunk);
    } else {
      this.reading = false;
    }
  }

  // 手动触发读取数据
  triggerRead() {
    if (!this.reading && this.chunks.length > 0) {
      this.reading = true;
      this._read(); // 调用 _read 触发数据的推送
    }
  }

  // 在连接关闭时结束流
  endStream() {
    this.push(null); // 结束流
  }
}
class UserSpeechSpace {
  constructor(
    public audioChunks: Buffer[],
    public audioStream: AudioStream,
    public pcmStream: PassThrough
  ) {}
}
export class SpeechRecognition {
  recWorker!: Worker;
  userSpeechSpaceMap: Map<string, UserSpeechSpace> = new Map();
  rceTaskQueue = new WorkerTaskQueue<{ action: string; data: any }>();
  // TODO: 目前只能识别中文和英文
  initTranslationService() {
    // 如果已经存在旧的 Worker，清理掉（避免重复绑定）
    if (this.recWorker) {
      this.recWorker.terminate();
    }
    this.recWorker = new Worker(path.join(__dirname, "./speechRecognitionWork.js"));
    this.rceTaskQueue.setWorker(this.recWorker);
    this.recWorker.on("message", async ({ userId, text }) => {
      this.rceTaskQueue.handleNextTaskDone();
      if (!text || text.trim() === "") {
        return;
      }
      if (text.trim() === "the" || text.trim() === "我") {
        return;
      }
      const srcLang = userStatusManager.getUserLang(userId);
      const name = userStatusManager.getName(userId);
      try {
        const result = await axios.post("http://127.0.0.1:9090/translate", {
          text,
          lang: srcLang,
        });
        const translateText = result.data.translateText;
        const punctuatedText = result.data.punctuatedText;
        console.log("翻译结果：", result.data.translateText);
        const roomId = userStatusManager.getUserRoomId(userId); // TODO: 判断一下用户是否在房间中，可能用户退出了，但是部分语音还没有发出
        roomStatusManager.getRoomUserSetIng(roomId).forEach((userId) => {
          if (srcLang !== userStatusManager.getUserLang(userId)) {
            userStatusManager.getUserWebSocket(userId)!.emit("speech", {
              text: translateText,
              name: name,
            });
          }
        });
        const srcMeetSheep = new MeetSpeech(
          translateText,
          new Date(),
          userId,
          roomId,
          srcLang === "en" ? "zh" : "en"
        );
        const tgtMeetCheep = new MeetSpeech(
          punctuatedText,
          new Date(),
          userId,
          roomId,
          srcLang
        );
        meetSpeechDao.insertSpeech(srcMeetSheep);
        meetSpeechDao.insertSpeech(tgtMeetCheep);
      } catch (error) {
        console.log("翻译失败：", error);
      }
    });

    this.recWorker.on("error", (err) => {
      this.rceTaskQueue.handleNextTaskDone();
      console.error("Worker 线程错误:", err);
    });
    this.recWorker.on("exit", (code) => {
      if (code !== 0) {
        console.error(`Worker 线程退出，错误码 ${code}`);
        this.initTranslationService(); //非正常退出，重新初始化
      }
    });
  }
  initRecognizer(userId: string, lang: string) {
    if (this.userSpeechSpaceMap.has(userId)) {
      return;
    }
    const audioChunks = Array<Buffer>();
    const audioStream = new AudioStream({}, audioChunks);
    const pcmStream = new PassThrough();
    this.userSpeechSpaceMap.set(userId, {
      audioChunks,
      audioStream,
      pcmStream,
    });
    this.recWorker.postMessage({ action: "init", data: { userId, lang } });
    ffmpeg()
      .input(audioStream)
      .inputFormat("webm") // 如果 WebSocket 是传输 WebM 格式的音频
      .audioFilters([
        "highpass=f=200", // 200Hz 高通滤波
        "lowpass=f=3000", // 3000Hz 低通滤波
      ])
      .audioCodec("pcm_s16le") // 使用 16-bit PCM 编码
      .audioFrequency(config.speechRecognition.sampleRate) // 设置采样率
      .audioChannels(1) // 单声道音频
      .format("wav") // 输出为 wav 格式
      .on("end", () => {
        console.log("ffmpeg音频处理完成");
      })
      .on("error", (err) => {
        console.error("处理音频时出错:", err);
      })
      .pipe(pcmStream, { end: false }); // 将转换后的音频流传输到 pcmStream
    //创建一个单独的工作线程
    pcmStream.on("data", async (audioBuffer) => {
      if (audioBuffer.length === 0) return;
      this.rceTaskQueue.addTaskToQueue({
        action: "newData",
        data: { userId, audioBuffer },
      });
    });
    console.log("开始语音识别");
  }
  rec(userId: string, buffer: Buffer) {
    if (!this.userSpeechSpaceMap.get(userId)) {
      return;
    }
    this.userSpeechSpaceMap.get(userId)!.audioChunks.push(buffer);
    this.userSpeechSpaceMap.get(userId)!.audioStream.triggerRead();
  }
  closeRecognizer(userId: string) {
    let userSpeechSpace = this.userSpeechSpaceMap.get(userId);
    if (userSpeechSpace) {
      userSpeechSpace.pcmStream.end(); // 结束 PCM 流
      userSpeechSpace.audioStream.endStream(); // 结束流
    }
    this.userSpeechSpaceMap.delete(userId);
    this.rceTaskQueue.addTaskToQueue({ action: "close", data: { userId } });
    console.log("关闭语音识别");
  }
}
const speechRecognitionUtil = new SpeechRecognition();
export { speechRecognitionUtil };
