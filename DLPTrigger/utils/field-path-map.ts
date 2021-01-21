import { StatusFields } from '../models/AdoWorkItemsDlpStatus'

// Generic Field Types
export const WORKITEM_TYPE_FIELD_PATHS = [
  ['resource', 'revision', 'fields', 'System.WorkItemType'],
  ['resource', 'fields', 'System.WorkItemType']
]
export const PROJECT_ID_FIELD_PATH = ['resourceContainers', 'project', 'id']
export const RESOURCE_ID_FIELD_PATHS = [
  ['resource', 'revision', 'id'],
  ['resource', 'id']
]

// List of Workitem Types
export enum WORKITEM_TYPES {
  BUG = 'Bug',
  EPIC = 'Epic',
  FEATURE = 'Feature',
  ISSUE = 'Issue',
  TASK = 'Task',
  TEST_CASE = 'Test Case',
  USER_STORY = 'User Story'
}

export interface FieldMapItem {
  fieldName: string
  fieldPaths: string[][]
  fieldType: 'text' | 'html' | 'xml'
  dbField: StatusFields
}

// Fields for Workitem of type Bug
const BUG_FIELD_MAP: FieldMapItem[] = [
  {
    fieldName: 'Title',
    fieldPaths: [
      ['resource', 'revision', 'fields', 'System.Title'],
      ['resource', 'fields', 'System.Title']
    ],
    fieldType: 'text',
    dbField: StatusFields.Title
  },
  {
    fieldName: 'System Info',
    fieldPaths: [
      ['resource', 'revision', 'fields', 'Microsoft.VSTS.TCM.SystemInfo'],
      ['resource', 'fields', 'Microsoft.VSTS.TCM.SystemInfo']
    ],
    fieldType: 'html',
    dbField: StatusFields.SystemInfo
  },
  {
    fieldName: 'Reproduction Steps',
    fieldPaths: [
      ['resource', 'revision', 'fields', 'Microsoft.VSTS.TCM.ReproSteps'],
      ['resource', 'fields', 'Microsoft.VSTS.TCM.ReproSteps']
    ],
    fieldType: 'html',
    dbField: StatusFields.ReproductionSteps
  }
]

// Fields for Workitem of type Epic
const EPIC_FIELD_MAP: FieldMapItem[] = [
  {
    fieldName: 'Title',
    fieldPaths: [
      ['resource', 'revision', 'fields', 'System.Title'],
      ['resource', 'fields', 'System.Title']
    ],
    fieldType: 'text',
    dbField: StatusFields.Title
  },
  {
    fieldName: 'Description',
    fieldPaths: [
      ['resource', 'revision', 'fields', 'System.Description'],
      ['resource', 'fields', 'System.Description']
    ],
    fieldType: 'html',
    dbField: StatusFields.Description
  }
]

// Fields for Workitem of type Feature
const FEATURE_FIELD_MAP: FieldMapItem[] = [...EPIC_FIELD_MAP]

// Fields for Workitem of type Issue
const ISSUE_FIELD_MAP: FieldMapItem[] = [...EPIC_FIELD_MAP]

// Fields for Workitem of type Task
const TASK_FIELD_MAP: FieldMapItem[] = [...EPIC_FIELD_MAP]

// Fields for Workitem of type Test Case
const TEST_CASE_FIELD_MAP: FieldMapItem[] = [
  {
    fieldName: 'Title',
    fieldPaths: [
      ['resource', 'revision', 'fields', 'System.Title'],
      ['resource', 'fields', 'System.Title']
    ],
    fieldType: 'text',
    dbField: StatusFields.Title
  },
  {
    fieldName: 'Steps',
    fieldPaths: [
      ['resource', 'revision', 'fields', 'Microsoft.VSTS.TCM.Steps'],
      ['resource', 'fields', 'Microsoft.VSTS.TCM.Steps']
    ],
    fieldType: 'xml',
    dbField: StatusFields.ReproductionSteps
  }
]

// Fields for Workitem of type User Story
const USER_STORY_FIELD_MAP: FieldMapItem[] = [
  ...EPIC_FIELD_MAP,
  {
    fieldName: 'Acceptance Criteria',
    fieldPaths: [
      ['resource', 'revision', 'fields', 'Microsoft.VSTS.Common.AcceptanceCriteria'],
      ['resource', 'fields', 'Microsoft.VSTS.Common.AcceptanceCriteria']
    ],
    fieldType: 'html',
    dbField: StatusFields.AcceptanceCriteria
  }
]

export const TARGET_FIELDS = {
  [WORKITEM_TYPES.BUG]: BUG_FIELD_MAP,
  [WORKITEM_TYPES.EPIC]: EPIC_FIELD_MAP,
  [WORKITEM_TYPES.FEATURE]: FEATURE_FIELD_MAP,
  [WORKITEM_TYPES.ISSUE]: ISSUE_FIELD_MAP,
  [WORKITEM_TYPES.TASK]: TASK_FIELD_MAP,
  [WORKITEM_TYPES.TEST_CASE]: TEST_CASE_FIELD_MAP,
  [WORKITEM_TYPES.USER_STORY]: USER_STORY_FIELD_MAP
}
