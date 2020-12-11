import fs from 'fs'
import path from 'path'
import { Model, Document } from 'mongoose'

export const models: { [key: string]: Model<Document> } = {}

export async function setupModels (connection, context) {
  const allFiles = fs.readdirSync(__dirname)
  const modelFiles = allFiles.filter(file => ~file.search(/^[^.].*\.(t|j)s$/) && !file.includes('index'))
  for (const file of modelFiles) {
    const modelInfo = await import(path.join(__dirname, file))
    models[modelInfo.modelName] = modelInfo.setupModel(connection)
  }
  return models
}
