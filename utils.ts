import { promisify } from 'node:util'
import stream from 'node:stream'
import got from 'got'
import fse from 'fs-extra'
import path from 'path'
import { exiftool } from 'exiftool-vendored'
import dayjs from 'dayjs'

const pipeline = promisify(stream.pipeline)

export async function downloadAsset(url: string, dest: string) {
  if (!fse.pathExistsSync(dest)) {
    fse.ensureDirSync(dest)
  }
  const destFile = path.join(dest, path.basename(url))
  if (!fse.pathExistsSync(destFile)) {
    await pipeline(
      //
      got.stream(url),
      fse.createWriteStream(destFile)
    )
    console.log(`${url} downloaded!`)
  }
  // else {
  //   // console.log(`${url} skipped!`)
  // }
  return destFile
}

export function outputMd({
  date,
  content,
  images,
  videos
}: {
  date: string
  content: string
  images: string[]
  videos: string[]
}) {
  let mdContent = `# ${date}\n\n`

  if (content) {
    mdContent += content.replace(/\n/g, '\n\n') + '\n\n'
  }

  if (images.length) {
    mdContent +=
      images
        .map(url => {
          const filename = path.basename(url)
          return `![${filename}](${filename})`
        })
        .join('\n\n') + '\n\n'
  }

  if (videos.length) {
    mdContent +=
      videos
        .map(url => {
          const filename = path.basename(url)
          return `<video src="${filename}" controls="controls"></video>`
        })
        .join('\n\n') + '\n\n'
  }

  return mdContent
}

export async function doExif(filePath: string, time: string) {
  try {
    console.log(`write exif to ${filePath}`)
    await exiftool.write(filePath, {
      AllDates: time.replace(/\s/, 'T'),
      TimeZoneOffset: 8
    })
    fse.removeSync(filePath + '_original')
  } catch (error: any) {
    console.error(error)
  }
}

export function getImageUrl(imgStr: string) {
  return imgStr.split(',')
}
