import vosk from "vosk";
import config from "../common/config/config";
import { PassThrough, Readable, ReadableOptions } from "stream";
import { webSocketServer } from "../webSocket/webSocketServer";
import ffmpeg from "fluent-ffmpeg";
import axios from "axios";
import { Worker } from "worker_threads";
import path from "path";
import { roomStatusManager } from "../services/roomStatusManager";
import userStatusManager from "../services/userStatusManager";
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
      console.log("chunks", this.chunks);
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
  initTranslationService() {
    this.recWorker = new Worker(path.join(__dirname, "./recWork.js"));
    this.recWorker.on("message", async ({ userId, text }) => {
      if (!text || text.trim() === "") {
        return;
      }
      const srcLang=userStatusManager.getUserLang(userId);
      const name=userStatusManager.getName(userId);
      try {
        const translateText = await axios.post(
          "http://127.0.0.1:8001/translate",
          { text, lang:srcLang, }
        );
        console.log("翻译结果：", translateText.data.translateResult);
        const roomId=userStatusManager.getUserRoomId(userId);
        roomStatusManager.getRoomUserSet(roomId).forEach((userId) => {
          if(srcLang!==userStatusManager.getUserLang(userId)){
            userStatusManager.getUserWebSocket(userId)!.emit("speech", {
              text: translateText.data.translateResult,
              name: name
            });
          }
        });
      } catch (error) {
        console.log("翻译失败：", error);
      }
    });

    this.recWorker.on("error", (err) => {
      console.error("Worker 线程错误:", err);
    });
    this.recWorker.on("exit", (code) => {
      if (code !== 0) {
        console.error(`Worker 线程退出，错误码 ${code}`);
      }
    });
  }
  initRecognizer(userId: string,lang:string) {
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
    this.recWorker.postMessage({action: 'init', data:{userId,lang}})
    ffmpeg()
      .input(audioStream)
      .inputFormat("webm") // 如果 WebSocket 是传输 WebM 格式的音频
      .audioFilters([
        'highpass=f=200',  // 200Hz 高通滤波
        'lowpass=f=3000',  // 3000Hz 低通滤波
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
      this.recWorker.postMessage({action:'newData',data:{userId, audioBuffer} });
    });
    console.log("开始语音识别");
  }
  rec(userId: string, buffer: Buffer) {
    console.log("输入长度", buffer.length);
    if (!this.userSpeechSpaceMap.get(userId)) {
      return;
    }
    this.userSpeechSpaceMap.get(userId)!.audioChunks.push(buffer);
    this.userSpeechSpaceMap.get(userId)!.audioStream.triggerRead();
  }
  closeRecognizer(userId: string) {
    let userSpeechSpace = this.userSpeechSpaceMap.get(userId);
    if (userSpeechSpace) {
      userSpeechSpace.audioStream.endStream(); // 结束流
      userSpeechSpace.pcmStream.end(); // 结束 PCM 流
    }
    this.userSpeechSpaceMap.delete(userId);
    this.recWorker.postMessage({action: 'close', data:{userId}})
    console.log("关闭语音识别");
  }
}
const speechRecognitionUtil = new SpeechRecognition();
export { speechRecognitionUtil };
