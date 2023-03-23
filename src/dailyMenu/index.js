import axios from 'axios'
import { BAIDU_TOKEN, HDEC_TOKEN } from '../../config.js'
const request = axios.create()

const { API_Key, Secret_Key } = BAIDU_TOKEN
const { username: uid, password: pwd } = HDEC_TOKEN

const param = {
    'grant_type': 'client_credentials',
    'client_id': API_Key,
    'client_secret': Secret_Key
}
const str_language = "zh_CN"

export const getMenuAsString = async () => {
    try {
        //登录
        const cookie = await login()
        request.defaults.withCredentials = true
        request.defaults.headers.Cookie = cookie


        //百度token
        const data = await getAccessToken()
        const { access_token: ak } = data

        //获取每周菜单
        const monday = getMonday()
        const menuData = await getWeeklyMenu()

        let menuNum = 0
        let weeklyMenu = []
        const menuArr = menuData.data

        for (let menuItem of menuArr) {

            const { GUID: guid, CONTENTATTACHMENTID: attachmentId, DATETIME: date, TITLE: title } = menuItem

            if (title.includes('西溪') && title.includes(monday)) {
                menuNum++
                if (menuNum > 2) break
            } else {
                continue
            }

            //获得当天菜单对应的pdf
            const year = date.split('-')[0]
            const month = String(Number(date.split('-')[1]))
            const doc = await getPdfId(guid)


            for (let pdf of doc.returnMap.fileList_content) {
                const { FILEID: fileId } = pdf
                const blob = await getPdf(year, month, fileId, attachmentId)
                const file = Buffer.from(blob, 'binary').toString('base64')

                let wordArr = []

                //获得识别结果
                for (let page = 1; page <= 3; page++) {
                    const result = await baiduApi(ak, file, page)
                    const { words_result = [] } = result
                    wordArr = wordArr.concat(words_result)
                }

                weeklyMenu.push(formatMenu(wordArr))
            }
        }

        //获取今天的菜单
        const day = numToChina[new Date().getDay()]

        let str = ''

        for (let menu of weeklyMenu) {
            str = str + menu[0] + '\n'
            let line = 1
            while (menu[line] && (!menu[line].includes(`星期`) || (menu[line].includes(`星期`) && !menu[line].includes(`星期${day}`)))) {
                line++
            }
            str = str + menu[line] + '\n'
            line++
            while (menu[line] && !menu[line].includes(`星期`)) {
                str = str + menu[line] + '\n'
                line++
            }
            str = str + '\n'
        }

        return str
    }
    catch (e) {
        return e
    }
}



request.interceptors.request.use(
    config => {
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

request.interceptors.response.use(
    response => {
        if (response.config.responseType == 'blob') {
            return response
        }

        if (response.data?.UserNotLogin) {
            return Promise.reject('oa无权限')
        }

        if (response.headers && response.headers['set-cookie'] && response.config.url.includes('LoginServlet')) {
            return response.headers['set-cookie']
        }

        return response.data
    },
    error => {
        return Promise.reject(error)
    }
)

const numToChina = ['天', '一', '二', '三', '四', '五', '六']

const formatMenu = (menu) => {
    if (!menu || menu.length == 0) {
        return []
    }
    let newArr = []
    let stack = []
    let origin = menu.map(item => item.words.replace(/[【|】]/g, '').replace(/：/g, ':'))

    newArr.push(origin.shift())

    while (origin.length > 0) {
        let line = origin.shift()
        if (line.includes('年') || line.includes(':') || line.includes('：')) {
            newArr.push(stack.join())
            stack = []
        }
        stack.push(line)
    }

    return newArr.filter(item => item && !item.includes('卤味') && !item.includes('砂锅'))
}

const getMonday = () => {
    const now = new Date();
    const nowTime = now.getTime();
    const day = now.getDay();
    const oneDayTime = 24 * 60 * 60 * 1000;
    //显示周一
    const MondayTime = nowTime - (day - 1) * oneDayTime;
    const monday = new Date(MondayTime)
    return `${monday.getMonth() + 1}月${monday.getDate()}`
}


const login = async () => request({
    url: 'http://oa.hdec.com/systemcenter/servlet/LoginServlet.cmd',
    method: "POST",
    headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    },
    data: {
        action: 'tologin',
        login: true,
        username: uid,
        password: pwd,
        saveInfo: true,
        local: str_language
    }
})

//获得每周菜单列表，其中包含文件的guid
//每周菜单包含DATE。可用于getPdf中的year和month
//这步需要权限，猜测带有Action.cmd的都需要鉴权
const getWeeklyMenu = async () => request({
    url: `http://webcms.hdec.com/integratedsubsys//servlet/Action.cmd?_method=CMS_COMMON.getDataList&directory=mzcd&tableName=CMS_INFORMATION`,
    method: "GET"
})

//通过guid获取文件名
//这步需要权限
const getPdfId = async (guid = "56255") => request({
    url: `http://webcms.hdec.com/integratedsubsys/servlet/Action.cmd?_method=CMS_INFORMATION.getContent&guid=${guid}`,
    method: "GET"
})

//文件名获取blob
const getPdf = async (year = "2023", month = "2", fileId = 'dfe6e6798aeb55cf65d3b5618fc2d321', attachmentId = '3f32ca72-cf59-7bb7-0dff-8f6757f27fbb') => request({
    url: `http://oa.hdec.com/PDFViewService/forms/pdfview/web/files//integratedsubsys/${year}/${year}-${month}/${attachmentId}/${fileId}.PDF`,
    method: "GET",
    responseType: 'arraybuffer',
    responseEncoding: 'binary',
})

//获得百度access_token
const getAccessToken = async () => request({
    url: 'http://aip.baidubce.com/oauth/2.0/token',
    method: "GET",
    headers: {
        "content-type": "application/json",
    },
    params: param
})


//百度OCR，blob文字识别
const baiduApi = async (ak, file, page = '') => request({
    url: `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${ak}`,
    method: "POST",
    headers: {
        "content-type": "application/x-www-form-urlencoded",
    },
    data: {
        pdf_file: file,
        pdf_file_num: page
    }
})