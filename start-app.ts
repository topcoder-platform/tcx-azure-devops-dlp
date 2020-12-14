import httpTrigger from './DLPTrigger'
import util from 'util'
import fs from 'fs'

process.env.COSMOS_MONGO_CONNECTION_STRING = 'mongodb://root:password@localhost:27017'

async function postRequest () {
  const req = {
    method: 'POST',
    body: JSON.parse(fs.readFileSync('./DLPTrigger/sample-payloads/bug/bug-updated.json', 'utf-8'))
  }
  const context = {
    log: console.log,
    req,
    res: {}
  }
  await httpTrigger(context as any, req)
  return context.res
}

async function getRequest () {
  const req = {
    method: 'GET',
    query: {
      project_id: 'dc2d3852-e28c-4bc3-aa3c-a7a457456730',
      resource_id: '39'
    }
  }
  const context = {
    log: console.log,
    req,
    res: {}
  }
  await httpTrigger(context as any, req)
  return context.res
}

async function main () {
  console.log(util.inspect(await postRequest(), { showHidden: true, depth: null }))
  console.log(util.inspect(await getRequest(), { showHidden: true, depth: null }))
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main()
