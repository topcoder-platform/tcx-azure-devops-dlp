import { Context, HttpRequest } from '@azure/functions'
import { createHash } from 'crypto'

export default async function handleOptionsRequest (
  _context: Context,
  req: HttpRequest
) {
  const handshakeRequestData = req.headers['x-handshake-request-data']
  if (!handshakeRequestData) {
    return {}
  }
  const digest = createHash('sha256').update(handshakeRequestData).digest('hex')
  const responseHeaders = { 'x-handshake-response-data': digest }
  return responseHeaders
}
