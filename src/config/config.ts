export default {
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
    }
}
