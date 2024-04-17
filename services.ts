import got from 'got'
import * as dotenv from 'dotenv'
import { readData, writeData } from './db'
import { SignItem } from 'interfaces'

dotenv.config()

const COOKIE = process.env.COOKIE
const CHILD_ID = process.env.CHILD_ID

export async function getSignData(date: string): Promise<SignItem[]> {
  try {
    // @ts-ignore
    const data = await got
      .post('https://zths.szy.cn/ZTHServer/signmanageserver/signin/appHandle', {
        form: {
          reqcode: '10934',
          reqcodeversion: '5.3',
          body: JSON.stringify({
            childid: CHILD_ID,
            date,
            showCancel: true
          })
        },
        headers: {
          Cookie: COOKIE
        }
      })
      .json()

    // console.log(data)
    const { body } = data as any
    if (body && body.list) {
      return body.list ?? []
    }
    return []
  } catch (error) {
    console.error(error)
    return []
  }
}
