/*
 * @Author: cytra
 * @Date: 2023-02-22 16:38:38
 * @LastEditTime: 2023-03-23 11:23:02
 * @Description: 使用openai提供的chatgpt，需要token
 */
import remark from 'remark'
import stripMarkdown from 'strip-markdown'
import { Configuration, OpenAIApi } from 'openai'
import { CHATGPT_TOKEN } from '../../config.js'
const { apiKey, organization } = CHATGPT_TOKEN

let openai = null

function markdownToText(markdown) {
  return remark()
    .use(stripMarkdown)
    .processSync(markdown || '')
    .toString()
}

async function geGPTReply(content) {
  try {
    if (!openai) {
      let configuration = new Configuration({
        apiKey: apiKey,
        organization: organization
      })
      openai = new OpenAIApi(configuration)
    }

    // const response2 = await openai.listEngines();
    // console.log(response2)
    // return
    console.log(`等待chatGpt返回:${content}`)
    let response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: content,
      temperature: 0.9, // 每次返回的答案的相似度0-1（0：每次都一样，1：每次都不一样）
      max_tokens: 2000,
      top_p: 1,
      frequency_penalty: 0.0,
      presence_penalty: 0.6,
      stop: ['Human:', 'AI:'],
    })
    console.log('chat gpt返回原始数据：')
    console.log(response.data.choices)
    response = markdownToText(response.data.choices[0].text)

    let replys = []
    let message = response;
    while (message.length > 500) {
      replys.push(message.slice(0, 500));
      message = message.slice(500);
    }
    replys.push(message)
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

export { geGPTReply }
export default {
  geGPTReply
}
