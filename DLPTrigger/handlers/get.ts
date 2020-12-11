import { Context, HttpRequest } from '@azure/functions'
import Boom from '@hapi/boom'

import { getItem } from '../models/AdoWorkItemsDlpStatus'

export default async function handleGetRequest (
  _context: Context,
  req: HttpRequest
) {
  const projectId = req.query.project_id
  if (!projectId) {
    throw Boom.badRequest('project_id is required')
  }
  const resourceId = req.query.resource_id
  if (!resourceId) {
    throw Boom.badRequest('resource_id is required')
  }
  const dbRecord = await getItem(projectId, resourceId)
  const plainObject = dbRecord.toObject()
  delete plainObject._id
  delete (plainObject as any).__v
  return plainObject
}
