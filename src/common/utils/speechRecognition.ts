import vosk from "vosk";
import config from "../config/config";
import { PassThrough, Readable, ReadableOptions } from "stream";
import { webSocketServer } from "../../webSocket/webSocketServer";
import ffmpeg from "fluent-ffmpeg";
class AudioStream extends Readable {
  chunks: Array<any>;
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
    public audioChunks: Array<any>,
    public audioStream: AudioStream,
    public pcmStream: PassThrough,
    public speechRecognition: vosk.Recognizer<any>
  ) {}
}
export class SpeechRecognition {
  model!: vosk.Model;
  userSpeechSpaceMap: Map<string, UserSpeechSpace> = new Map();
  init() {
    this.model = new vosk.Model(config.speechRecognition.modelPath);
    console.log("SpeechRecognition init");
  }
  init1(userId: string) {
    const speechRecognition = new vosk.Recognizer({
      model: this.model,
      sampleRate: config.speechRecognition.sampleRate,
    });
    const audioChunks = Array<any>();
    const audioStream = new AudioStream({}, audioChunks);
    const pcmStream = new PassThrough();
    this.userSpeechSpaceMap.set(userId, {
      audioChunks,
      audioStream,
      pcmStream,
      speechRecognition
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

    pcmStream.on("data", async (chunk) => {
      let translatedText;
      let recognitionText;
      const speech = speechRecognition.acceptWaveform(chunk);
      if (speech) {
        console.log("接收到音频数据：");
        let maxConfidence = 0;
        let speechToText = speechRecognition.result();
        console.log(speechToText);
      }
    });
    console.log("开始识别")
  }
  rec(userId:string,buffer: Buffer) {
    this.userSpeechSpaceMap.get(userId)!.audioChunks.push(buffer);
    this.userSpeechSpaceMap.get(userId)!.audioStream.triggerRead();
  }
}
const speechRecognition = new SpeechRecognition();
export { speechRecognition };
