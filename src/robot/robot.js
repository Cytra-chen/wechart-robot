import { WechatyBuilder } from 'wechaty'
import { onMessage } from './onMessage.js'
import { PAD_LOCAL_TOKEN } from '../../config.js'

const name = 'my-robot';
const wechaty = WechatyBuilder.build({
    name,
    puppet: 'wechaty-puppet-padlocal',
    puppetOptions: {
        token: PAD_LOCAL_TOKEN
    }
})

// const wechaty = WechatyBuilder.build({
//     name,
//     puppet: 'wechaty-puppet-wechat4u'
// })

wechaty
    .on('scan', (qrcode, status) => console.log(`Scan QR Code to login: ${status}\nhttps://wechaty.js.org/qrcode/${encodeURIComponent(qrcode)}`))
    .on('login', user => console.log(`User ${user} logged in`))
    .on('message', onMessage)



export function initRobot() {
    wechaty.start()
        .catch((e) => console.error(e))
}