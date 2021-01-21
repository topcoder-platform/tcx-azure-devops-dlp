import { Context, HttpRequest } from '@azure/functions'
import Boom from '@hapi/boom'
import _ from 'lodash'
import { htmlToText } from 'html-to-text'

import { identifyPII } from '../utils/presidio'
import { DlpStatus, DlpStatusItem, getItem, setNoErrors, StatusFields } from '../models/AdoWorkItemsDlpStatus'

import {
  FieldMapItem,
  PROJECT_ID_FIELD_PATH,
  WORKITEM_TYPE_FIELD_PATHS,
  RESOURCE_ID_FIELD_PATHS,
  TARGET_FIELDS,
  WORKITEM_TYPES
} from '../utils/field-path-map'

interface FieldMapRecord {
  startIndex: number | null
  endIndex: number | null
  fieldMapItem: FieldMapItem
  found: boolean
  isString: boolean
  rawValue: string | null
  processedValue: string | null
}

export default async function handlePostRequest (
  _context: Context,
  req: HttpRequest
) {
  let workItemType: WORKITEM_TYPES | undefined
  for (const workItemTypeFieldPath of WORKITEM_TYPE_FIELD_PATHS) {
    workItemType = _.get(req.body, workItemTypeFieldPath)
    if (workItemType) {
      break
    }
  }
  if (!workItemType) {
    throw Boom.badRequest(`Did not find expected property at path: ${WORKITEM_TYPE_FIELD_PATHS.map(i => i.join('.')).join(', ')}`)
  }
  const projectId = _.get(req.body, PROJECT_ID_FIELD_PATH)
  if (!projectId) {
    throw Boom.badRequest(`Did not find expected property at path: ${PROJECT_ID_FIELD_PATH.join(', ')}`)
  }
  let resourceId: string | undefined
  for (const resourceIdFieldPath of RESOURCE_ID_FIELD_PATHS) {
    resourceId = _.get(req.body, resourceIdFieldPath)
    if (resourceId) {
      break
    }
  }
  if (!resourceId) {
    throw Boom.badRequest(`Did not find expected property at path: ${RESOURCE_ID_FIELD_PATHS.map(i => i.join('.')).join(', ')}`)
  }
  const fieldMap = TARGET_FIELDS[workItemType]
  if (!fieldMap) {
    throw Boom.badRequest(`Unexpected resource of type ${workItemType}. Accepted values: ${Object.keys(TARGET_FIELDS).join(', ')}.`)
  }
  const records: FieldMapRecord[] = []
  let recordString: string = ''
  for (const fieldItem of fieldMap) {
    let fieldValue: string | null = null
    for (const fieldPath of fieldItem.fieldPaths) {
      fieldValue = _.get(req.body, fieldPath)
      if (fieldValue) {
        break
      }
    }
    if (!fieldValue || !_.isString(fieldValue)) {
      records.push({
        startIndex: null,
        endIndex: null,
        fieldMapItem: fieldItem,
        found: !!fieldValue,
        isString: _.isString(fieldValue),
        rawValue: null,
        processedValue: null
      })
      continue
    }
    const plainTextFieldValue: string = htmlToText(fieldValue)
    records.push({
      startIndex: recordString.length,
      endIndex: recordString.length + plainTextFieldValue.length + 1,
      fieldMapItem: fieldItem,
      found: true,
      isString: true,
      rawValue: fieldValue,
      processedValue: plainTextFieldValue
    })
    recordString = `${recordString}${plainTextFieldValue}\n`
  }
  const piiDetailList = await identifyPII(recordString)
  const adoWorkItemsDlpStatus: DlpStatusItem = await getItem(projectId, resourceId)!
  await setNoErrors(adoWorkItemsDlpStatus)
  if (_.isNil(piiDetailList)) {
    for (const statusField of Object.values(StatusFields)) {
      adoWorkItemsDlpStatus[statusField].status = DlpStatus.NO_ISSUES
      adoWorkItemsDlpStatus[statusField].issues = []
    }
    return { message: 'OK' }
  }
  for (const piiDetail of piiDetailList) {
    const startIdx = piiDetail.location.start
    for (const recordItem of records) {
      if (!recordItem.isString || !recordItem.found) {
        continue
      }
      if (recordItem.startIndex! <= startIdx && startIdx < recordItem.endIndex!) {
        const piiMatch = recordString.substr(piiDetail.location.start, piiDetail.location.length)
        adoWorkItemsDlpStatus[recordItem.fieldMapItem.dbField].status = DlpStatus.ISSUES_FOUND
        adoWorkItemsDlpStatus[recordItem.fieldMapItem.dbField].issues.push({
          text: piiMatch,
          score: piiDetail.score
        })
        break
      }
    }
  }
  for (const statusField of Object.values(StatusFields)) {
    if (adoWorkItemsDlpStatus[statusField].status !== DlpStatus.UNSCANNED) {
      continue
    }
    adoWorkItemsDlpStatus[statusField].status = DlpStatus.NO_ISSUES
    adoWorkItemsDlpStatus[statusField].issues = []
  }
  let dlpStatus = DlpStatus.NO_ISSUES
  for (const statusField of Object.values(StatusFields)) {
    if (adoWorkItemsDlpStatus[statusField].status === DlpStatus.ISSUES_FOUND) {
      dlpStatus = DlpStatus.ISSUES_FOUND
      break
    }
  }
  adoWorkItemsDlpStatus.dlpStatus = dlpStatus
  await adoWorkItemsDlpStatus.save()
  return { message: 'OK' }
}
