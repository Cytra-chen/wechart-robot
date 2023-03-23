import { getMenuAsString } from '../dailyMenu/index.js'
import { contactSay, roomSay } from "./reply.js";
import { geGPTReply } from './openai.js'
import { geGPT3Reply } from './chatgpt.js'

async function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function robotReply({ contact, room, content }) {
    try {
        if (content == '报菜名') {
            const reply = await getMenuAsString()
            sendReply({ contact, room, reply })
            return
        }

        let res = await geGPTReply(content, contact.name())
        if (res.length === 1 && !res[0].content) {
            console.log('第一个gpt接口返回失败，开始请求第二个gpt接口')
            res = await geGPT3Reply(content, contact.name())
        }

        for (let reply of res) {
            await delay(1000)
            await sendReply({ contact, room, reply: reply.content })
        }


    } catch (e) {
        console.log(e)
    }
}


async function sendReply({ contact, room, reply }) {
    if (room) {
        await roomSay(room, contact, reply);
    } else {
        await contactSay(contact, reply)
    }
}