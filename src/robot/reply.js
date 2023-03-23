/**
 * 私聊发送消息
 * @param contact
 * @param msg
 * @param isRoom
 *  type 1 文字 2 图片url 3 图片base64 4 url链接 5 小程序  6 名片
 */

export async function contactSay(contact, msg, isRoom = false) {
    console.log('私聊回复内容：', JSON.stringify(msg))
    try {
        await contact.say(msg)
    } catch (e) {
        console.log('私聊发送消息失败', e)
    }
}


export async function roomSay(room, contact, msg) {
    console.log('群聊回复内容：', JSON.stringify(msg))
    try {
        // contact ? await room.say(msg, contact) : room.say(msg)
        await room.say(msg)

    } catch (e) {
        console.log('群聊发送消息失败', e)
    }
}