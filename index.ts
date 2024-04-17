import { doExif, downloadAsset, getImageUrl, outputMd } from './utils'
import fse from 'fs-extra'
import path from 'path'
import * as dotenv from 'dotenv'
import { exiftool } from 'exiftool-vendored'
import { getSignData } from './services'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import { readData, writeData } from './db'
import { SignItem } from 'interfaces'

dayjs.extend(isSameOrAfter)
// exiftool.version().then(version => console.log(`We're running ExifTool v${version}`))

dotenv.config()

const dist = process.env.DIST ?? ''
const BEGIN_DAY = process.env.BEGIN_DAY

main()

async function main() {
  if (!fse.pathExistsSync(dist)) {
    fse.ensureDirSync(dist)
  }

  let dateDayJS = dayjs()
  const dayList = await readData()

  // 从开始日一直循环下去
  while (dateDayJS.isSameOrAfter(BEGIN_DAY, 'day')) {
    const dateFormatted = dateDayJS.format('YYYY-MM-DD')
    if (dayList.includes(dateFormatted)) {
      // continue
    } else {
      const signList = await getSignData(dateFormatted)
      await processSign(signList, dateFormatted)
      await writeData(dateFormatted)
    }

    dateDayJS = dateDayJS.subtract(1, 'day')
  }

  console.log(`everything is up-to-date!`)

  exiftool.end()
}

async function processSign(signList: SignItem[], dateFormatted: string) {
  // 没有签到数据
  if (signList.length === 0) return

  // 获取图片列表
  const images = signList
    .map(item => {
      return getImageUrl(item.img)
    })
    .flat()
    .filter(item => item)

  // 没有任何图片了
  if (images.length === 0) return

  // 创建日期文件夹
  const signItemPath = path.join(dist, dateFormatted)
  if (!fse.pathExistsSync(signItemPath)) {
    fse.ensureDirSync(signItemPath)
  }

  // 下载图片
  for (const signItem of signList) {
    const images = getImageUrl(signItem.img)
    for (const image of images) {
      if (image) {
        const filePath = await downloadAsset(image, signItemPath)
        await doExif(filePath, signItem.createtime)
      }
    }
  }

  // fse.outputFileSync(
  //   path.join(signItemPath, 'readme.md'),
  //   outputMd({
  //     date: dateFormatted,
  //     content: '',
  //     images,
  //     videos: []
  //   })
  // )
  console.log(`${signItemPath} archived!`)
}
