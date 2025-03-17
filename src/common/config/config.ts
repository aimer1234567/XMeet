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
    webServer:{
      isHttps:true,
      port:8080,
      host:"0.0.0.0",
      https:{
        key:"./ssl/private.key",
        cert:"./ssl/certificate.crt"
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
              announcedIp: getLocalIp()// replace by public IP address
            }
          ],
          maxIncomingBitrate: 1500000,
          initialAvailableOutgoingBitrate: 1000000
        }
      }

}