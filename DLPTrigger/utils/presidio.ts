import axios, { AxiosRequestConfig } from 'axios'
import https from 'https'

const httpsAgent = new https.Agent({ rejectUnauthorized: false })

export interface PresidioItem {
  field: {
    name: string
  }
  score: number
  location: {
    start: number
    end: number
    length: number
  }
}
export type PresidioRes = PresidioItem[]

interface PresidioItemV2 {
  analysis_explanation: null | string
  end: number
  entity_type: string
  score: number
  start: number
}

export type PresidioResV2 = PresidioItemV2[]

export async function identifyPII (dataString: string): Promise<PresidioRes> {
  const requestConfig: AxiosRequestConfig = {
    method: 'POST',
    url: process.env.PRESIDIO_ENDPOINT,
    data: {
      text: dataString,
      language: 'en'
    },
    headers: {
      Host: 'tcx-presidio.svc'
    },
    httpsAgent
  }
  const res = await axios.request<PresidioResV2>(requestConfig)
  if (res?.data instanceof Array) {
    return res.data.map(item => ({
      field: { name: item.entity_type },
      score: item.score,
      location: {
        start: item.start,
        end: item.end,
        length: item.end - item.start
      }
    }))
  }
  return res.data
}
