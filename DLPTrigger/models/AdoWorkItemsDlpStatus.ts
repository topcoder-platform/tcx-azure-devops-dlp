import mongoose from 'mongoose'
import _ from 'lodash'

// TYPES
export enum DlpStatus {
  UNSCANNED = 'UNSCANNED',
  NO_ISSUES = 'NO_ISSUES',
  ISSUES_FOUND = 'ISSUES_FOUND',
  OVERRIDE = 'OVERRIDE'
}

export enum StatusFields {
  Title = 'titleStatus',
  Details = 'detailsStatus',
  AcceptanceCriteria = 'acceptanceCriteriaStatus',
  ReproductionSteps = 'reproductionStepsStatus',
  Description = 'descriptionStatus',
  SystemInfo = 'systemInfoStatus',
  Analysis = 'analysisStatus'
}

interface IStatusField {
  status: DlpStatus
  issues: Array<{
    _id?: string
    score: number
    text: string
  }>
}

export interface DlpStatusItem extends mongoose.Document {
  projectId: string
  resourceId: string
  dlpStatus: DlpStatus
  [StatusFields.Title]: IStatusField
  [StatusFields.Details]: IStatusField
  [StatusFields.AcceptanceCriteria]: IStatusField
  [StatusFields.ReproductionSteps]: IStatusField
  [StatusFields.Description]: IStatusField
  [StatusFields.SystemInfo]: IStatusField
  [StatusFields.Analysis]: IStatusField
}

export const modelName = 'AdoWorkItemsDlpStatus'

let model: mongoose.Model<DlpStatusItem>

const schemaDefinition = {
  projectId: {
    type: String,
    trim: true,
    required: true,
    minLength: 1,
    index: true
  },
  resourceId: {
    type: String,
    trim: true,
    required: true,
    minLength: 1,
    index: true
  },
  dlpStatus: {
    type: String,
    enum: Object.values(DlpStatus),
    required: true,
    default: DlpStatus.UNSCANNED
  },
  ...(Object.values(StatusFields).reduce((acc, val) => {
    acc[val] = {
      _id: false,
      status: {
        type: String,
        enum: Object.values(DlpStatus),
        required: true,
        default: DlpStatus.UNSCANNED
      },
      issues: [{
        _id: false,
        score: Number,
        text: String
      }]
    }
    return acc
  }, {}))
}

const schemaOptions = {
  timestamps: false
}

// Initializes Mongo Schema
const DlpStatusSchema = new mongoose.Schema(schemaDefinition, schemaOptions)
DlpStatusSchema.index({ projectId: 1, resourceId: 1 }, { unique: true })

/**
 * Creates/Gets an item using the ADO Project ID and the Resource ID for an ADO Workitem
 * @param projectId ADO Project ID
 * @param resourceId ADO Workitem's Resource ID
 */
export const getItem = async (projectId: string, resourceId: string): Promise<DlpStatusItem> => {
  const query = { projectId, resourceId }
  const record = await model.findOneAndUpdate(query, query, { new: true, upsert: true })
  return record as DlpStatusItem
}

/**
 * Clears the record for a DLP Item
 * @param dlpStatusItem DB Record for DLP Status
 */
export const setNoErrors = async (dlpStatusItem: DlpStatusItem) => {
  for (const field of Object.values(StatusFields)) {
    dlpStatusItem[field].issues = []
    dlpStatusItem[field].status = DlpStatus.NO_ISSUES
  }
  dlpStatusItem.dlpStatus = DlpStatus.NO_ISSUES
  const record = await dlpStatusItem.save()
  return record
}

/**
 * Initializes the Model
 * @param connection Mongo Connection
 */
export const setupModel = (connection: typeof mongoose) => {
  model = _.get(connection, `models.${modelName}`)
  model = model || connection.model(modelName, DlpStatusSchema)
  return model
}
