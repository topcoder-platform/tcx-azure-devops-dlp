import { AzureFunction, Context, HttpRequest } from '@azure/functions'
import Boom from '@hapi/boom'
import GetHandler from './handlers/get'
import PostHandler from './handlers/post'
import OptionsHandler from './handlers/options'
import { connect } from './utils/db'

const commonHeaders = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
  // eslint-disable-next-line quote-props
  'Vary': 'Accept-Encoding, Origin',
  'Content-Type': 'application/json'
}

/**
 * Inserts the response body into the context so that it is readablr by the Azure function.
 * @param context Azure Functions Runtime Context
 * @param res Response Body
 */
const populateContextWithResponse = (
  context: Context,
  res: { [key: string]: any }
) => {
  context.res = {
    status: 200,
    body: {
      success: true,
      data: res
    },
    headers: commonHeaders
  }
  return context
}

/**
 * Handles incoming GET requests
 * @param context Azure Functions Runtime Context
 * @param req HTTP Request Object
 */
const handleGet: AzureFunction = async function (
  context: Context,
  req: HttpRequest
) {
  const res = await GetHandler(context, req)
  populateContextWithResponse(context, res)
}

/**
 * Handles incoming POST requests
 * @param context Azure Functions Runtime Context
 * @param req HTTP Request Object
 */
const handlePost: AzureFunction = async function (
  context: Context,
  req: HttpRequest
) {
  const res = await PostHandler(context, req)
  populateContextWithResponse(context, res)
}

/**
 * Handles Incoming OPTIONS requests
 * @param context Azure Function Runtime Context
 * @param req HTTP Request Object
 */
const handleOptions: AzureFunction = async function (
  context: Context,
  req: HttpRequest
) {
  const headers = await OptionsHandler(context, req)
  context.res = {
    status: 200,
    headers: {
      ...headers,
      ...commonHeaders,
      'Access-Control-Expose-Headers': Object.keys(headers).join(' ')
    }
  }
}

/**
 * Entry-point for the Azure Functions HTTP Request
 * @param context Azure Functions Runtime Context
 * @param req HTTP Request Object
 */
const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  // Store lower-case version of the headers
  for (const key in req.headers) {
    req.headers[key.toLowerCase()] = req.headers[key];
  }
  try {
    // Init DB connection
    await connect(context)
    // Send the request to the proper handler based on the request method
    switch (req.method) {
      case 'GET': {
        await handleGet(context, req)
        break
      }
      case 'POST': {
        await handlePost(context, req)
        break
      }
      case 'OPTIONS': {
        await handleOptions(context, req)
        break
      }
      default: {
        throw Boom.methodNotAllowed()
      }
    }
  } catch (err) {
    // Handle Boom Errors
    if (err.isBoom as boolean) {
      context.res = {
        status: err.output.statusCode,
        headers: commonHeaders,
        body: {
          success: false,
          message: err.message,
          ...(err.data ? { data: err.data } : {})
        }
      }
      return
    }
    // Handle non-boom error
    context.log(`Error occurred: ${err.message as string}`)
    context.log(err.stack)
    context.res = {
      status: 500,
      headers: commonHeaders,
      body: {
        message: 'Internal Server Error'
      }
    }
  }
}

export default httpTrigger
