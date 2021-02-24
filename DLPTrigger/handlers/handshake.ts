import { Context, HttpRequest } from '@azure/functions'
import { createHash } from 'crypto'
import Boom from '@hapi/boom'

export default async function handleHandshakeRequest (
  _context: Context,
  req: HttpRequest
) {
  const handshakeRequestData = req.headers['x-handshake-request-data']
  if (!handshakeRequestData) {
    throw Boom.badRequest('Missing handshake data header.')
  }
  const digest = createHash('sha256').update(handshakeRequestData).digest('hex')
  const responseHeaders = { 'x-handshake-response-data': digest }
  return responseHeaders
}
