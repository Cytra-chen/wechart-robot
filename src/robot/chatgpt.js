/*
 * @Author: cytra
 * @Date: 2023-02-22 14:50:58
 * @LastEditTime: 2023-03-23 11:24:28
 * @Description: 非官方的chatgpt接口，感觉模型版本较老
 */
import { ChatGPTAPI } from 'chatgpt'

const token = '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'
let chatGPT = null
let chatOption = {}

export async function initChatGPT() {
    chatGPT = new ChatGPTAPI({
        apiKey: token
    });
}

async function geGPT3Reply(content, uid) {
    try {
        if (!chatGPT) {
            await initChatGPT()
        }

        const { conversationId, text, id } = await chatGPT.sendMessage(content, chatOption[uid]);
        chatOption = {
            [uid]: {
                conversationId,
                parentMessageId: id,
            },
        };
        let replys = []
        let message = `${content}\n-----------\n` + text;
        while (message.length > 500) {
            replys.push(message.slice(0, 500));
            message = message.slice(500);
        }
        replys.push(message);
        replys = replys.map(item => {
            return {
                type: 1,
                content: item.trim()
            }
        })
        return replys
    } catch (e) {
        console.log('chat gpt报错：' + e);
        return [{ type: 1, content: '' }]
    }
}

export { geGPT3Reply }
export default {
    geGPT3Reply
}
