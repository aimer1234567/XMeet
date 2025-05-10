import { PortRange } from 'mediasoup/node/lib/fbs/transport/port-range'
import os from 'os'
const ifaces:any = os.networkInterfaces()
const getLocalIp = () => {
  let localIp = '127.0.0.1'
  Object.keys(ifaces).forEach((ifname:any) => {
    for (const iface of ifaces[ifname]) {
      // Ignore IPv6 and 127.0.0.1
      if (iface.family !== 'IPv4' || iface.internal !== false) {
        continue
      }
      // Set the local ip to the first IPv4 address found and exit the loop
      localIp = iface.address
      return
    }
  })
  return localIp
}

export default {
    log:{
      level:"debug",
      file:"logs/xmeet.log"
    },
    jwt:"dswdwqdqdqwdsqwdqd",
    openai:{
      apiKey:"sk-59e86a33b21546d58c3e6bdf81707f38",
      baseURL:"https://dashscope.aliyuncs.com/compatible-mode/v1",
      model:"qwen-turbo"
    },
    mailUtils: {
        host:"gz-smtp.qcloudmail.com",
        port:465,
        user:"aimer@luoxiaoying.online",// 发件人邮箱
        pass:"1234qwerASDF",// 发件人邮箱授权码
        secure:true,// 使用 SSL
        captchaMail:{
            subject:"XMeet",// 邮件主题
            text:"Hello, this is a XMeet."// 邮件文本内容
        }
    },
    meetServer:{
      closeTime:60,//会议超时时间，单位分钟
      remindTime:15,//会议超时提醒时间，单位分钟
      maxCloseTime:120, // 会议最大超时时间，单位分钟
      maxPeer:30,// 最大用户数
      maxSpeech:4,// 最大发言数
      maxAppointMeetNumber:5,
    },
    webServer:{
      isHttps:true,
      port:8080,
      host:"0.0.0.0",
      https:{
        key:"./ssl/private.key",
        cert:"./ssl/certificate.crt"
      }
    },
    speechRecognition:{
      cn_modelPath:"speech_model/cn_model/",
      en_modelPath:"speech_model/en_model/",
      sampleRate:16000
    },
    mediasoup: {
        // Worker settings
        numWorkers: Object.keys(os.cpus()).length/2,
        worker: {
          rtcMinPort: 50000,
          rtcMaxPort: 59000,
          logLevel: 'warn',
          logTags: [
            'info',
            'ice',
            'dtls',
            'rtp',
            'srtp',
            'rtcp'
            // 'rtx',
            // 'bwe',
            // 'score',
            // 'simulcast',
            // 'svc'
          ]
        },
        // Router settings
        router: {
          mediaCodecs: [
            {
              kind: 'audio',
              mimeType: 'audio/opus',
              clockRate: 48000,
              channels: 2
            },
            {
              kind: 'video',
              mimeType: 'video/VP8',
              clockRate: 90000,
              parameters: {
                'x-google-start-bitrate': 1000
              }
            }
          ]
        },
        // WebRtcTransport settings
        webRtcTransport: {
          listenIps: [
            {
              ip: '0.0.0.0',
              announcedIp: "10.22.92.125"// replace by public IP address
            }
          ],
          maxIncomingBitrate: 1500000,
          initialAvailableOutgoingBitrate: 1000000,
          portRange: { min: 50000, max: 59999 }
        }
      }

}