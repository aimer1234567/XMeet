import os from 'os'
export default {
    jwt:"dswdwqdqd",
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
    mediasoup: {
        // Worker settings
        numWorkers: Object.keys(os.cpus()).length,
        worker: {
          rtcMinPort: 10000,
          rtcMaxPort: 10100,
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
              announcedIp: '127.0.0.1'// replace by public IP address
            }
          ],
          maxIncomingBitrate: 1500000,
          initialAvailableOutgoingBitrate: 1000000
        }
      }

}
