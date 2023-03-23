
import { robotReply } from "./getReply.js"

/**
 * 检测是否属于忽略的消息
 * @param msg 用户信息
 * @param list 需要忽略的列表
 */
function checkIgnore(msg, name) {
  if (msg === '报菜名') return false
  if (name == 'Cytra') return false
  return false
  // return true
}


/**
 * 根据消息类型过滤私聊消息事件
 * @param {*} that bot实例
 * @param {*} msg 消息主体
 */
async function dispatchFriendFilterByMsgType(that, msg) {
  try {
    const type = msg.type();
    const contact = msg.talker(); // 发消息人
    const name = await contact.name()
    const isOfficial = contact.type() === that.Contact.Type.Official;
    switch (type) {
      case that.Message.Type.Text:
        const content = msg.text();
        if (!isOfficial) {
          console.log(`发消息人${name}:${content}`);
          const isIgnore = checkIgnore(content.trim(), name);
          if (content.trim() && !isIgnore) {
            //回个消息
            robotReply({ contact, content })
          }
        } else {
          console.log("公众号消息");
        }
        break;
      default:
        break;
    }
  } catch (error) {
    console.log("监听消息错误", error);
  }
}

/**
 * 根据消息类型过滤群消息事件
 * @param {*} that bot实例
 * @param {*} room room对象
 * @param {*} msg 消息主体
 */
async function dispatchRoomFilterByMsgType(that, room, msg) {
  try {
    const contact = msg.talker(); // 发消息人
    const contactName = contact.name();
    const roomName = await room.topic();
    const type = msg.type();
    const receiver = msg.to();
    let content = "";
    const userSelfName = that.currentUser?.name() || that.userSelf()?.name()
    switch (type) {
      case that.Message.Type.Text:
        content = msg.text();
        const mentionSelf = content.includes(`@${userSelfName}`);
        const receiverName = receiver?.name();
        content = content.replace('@' + receiverName, "").replace('@' + userSelfName, "").replace(/@[^,，：:\s@]+/g, "").trim();
        console.log(`群名: ${roomName} 发消息人: ${contactName} 内容: ${content} | 机器人被@：${mentionSelf ? '是' : '否'}`);
        // 检测是否需要这条消息
        if (!mentionSelf) {
          return
        }
        const isIgnore = checkIgnore(content, contactName);
        if (isIgnore) return;
        robotReply({ room, contact, content })
        break;
      default:
        break;
    }
  } catch (error) {
    console.log("监听消息错误", error);
  }
}


export async function onMessage(msg) {
  try {
    const room = msg.room(); // 是否为群消息
    const msgSelf = msg.self(); // 是否自己发给自己的消息
    if (msgSelf) return;
    if (room) {
      const roomName = await room.topic();
      const contact = msg.talker(); // 发消息人
      const contactName = contact.name();
      await dispatchRoomFilterByMsgType(this, room, msg);
    } else {
      await dispatchFriendFilterByMsgType(this, msg);
    }
  } catch (e) {
    console.log("监听消息失败", e);
  }
}


