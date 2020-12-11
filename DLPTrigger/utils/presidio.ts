import axios, { AxiosRequestConfig } from 'axios'

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

export type PresidioRes = PresidioItem[] | null

export async function identifyPII (dataString: string) {
  const requestConfig: AxiosRequestConfig = {
    method: 'POST',
    url: process.env.PRESIDIO_ENDPOINT,
    data: {
      text: dataString,
      analyzeTemplate: {
        allFields: true
      }
    }
  }
  const res = await axios(requestConfig)
  return res.data as PresidioRes
}
