/*
 * @Author: cytra
 * @Date: 2023-03-23 10:39:30
 * @LastEditTime: 2023-03-23 11:28:09
 * @Description: 入口文件
 */
import { getMenuAsString } from './src/dailyMenu/index.js'
// import { initRobot } from './src/robot/robot.js'

/**
 * @description: 获取食堂菜单
 */
getMenuAsString().
    then(res => {
        console.log(res)
    })

/**
 * @description: 初始化机器人
 */
// initRobot()