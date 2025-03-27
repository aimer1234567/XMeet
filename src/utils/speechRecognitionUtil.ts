import vosk from "vosk";
import config from "../common/config/config";
import { PassThrough, Readable, ReadableOptions } from "stream";
import { webSocketServer } from "../webSocket/webSocketServer";
import ffmpeg from "fluent-ffmpeg";
import axios from "axios";
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
    public pcmStream: PassThrough,
    public speechRecognition: vosk.Recognizer<any>
  ) {}
}
export class SpeechRecognition {
  model!: vosk.Model;
  userSpeechSpaceMap: Map<string, UserSpeechSpace> = new Map();
  initTranslationService() {
    this.model = new vosk.Model(config.speechRecognition.modelPath);
    console.log("语音识别模型加载成功");
  }
  initRecognizer(userId: string) {
    if (this.userSpeechSpaceMap.has(userId)) {
      return;
    }
    const speechRecognition = new vosk.Recognizer({
      model: this.model,
      sampleRate: config.speechRecognition.sampleRate,
    });
    const audioChunks = Array<Buffer>();
    const audioStream = new AudioStream({}, audioChunks);
    const pcmStream = new PassThrough();
    this.userSpeechSpaceMap.set(userId, {
      audioChunks,
      audioStream,
      pcmStream,
      speechRecognition,
    });
    ffmpeg()
      .input(audioStream)
      .inputFormat("webm") // 如果 WebSocket 是传输 WebM 格式的音频
      .audioCodec("pcm_s16le") // 使用 16-bit PCM 编码
      .audioFrequency(config.speechRecognition.sampleRate) // 设置采样率
      .audioChannels(1) // 单声道音频
      .format("wav") // 输出为 wav 格式
      .on("end", () => {
        console.log("音频处理完成");
      })
      .on("error", (err) => {
        console.error("处理音频时出错:", err);
      })
      .pipe(pcmStream, { end: false }); // 将转换后的音频流传输到 pcmStream
    //创建一个单独的工作线程
    pcmStream.on("data", async (chunk) => {
      if (chunk.length === 0) return;
      let translatedText;
      let recognitionText;
      const speech = speechRecognition.acceptWaveform(chunk);
      if (speech) {
        let speechToText = speechRecognition.result();
        console.log("接收到音频数据：", speechToText.text);
        if (!speechToText.text || speechToText.text.trim() === "") {
          return;
        }
        try {
          let translateText = await axios.post(
            "http://127.0.0.1:8001/translate",
            {
              text: speechToText.text,
              lang: "zh",
            }
          );
          console.log("翻译结果：", translateText.data.translateResult);
          webSocketServer.send(userId, "translateText", {
            translateText: translateText.data.translateResult,
          });
        } catch (error) {
          console.log("翻译失败：", error);
        }
      }
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
    userSpeechSpace?.speechRecognition.free();
    this.userSpeechSpaceMap.delete(userId);
    console.log("关闭语音识别");
  }
}
const speechRecognitionUtil = new SpeechRecognition();
export { speechRecognitionUtil };
