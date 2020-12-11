import mongoose from 'mongoose'
import { Context } from 'vm'
import { setupModels } from '../models'

let connection: typeof mongoose

/**
 * Connect to Cosmos DB and returns the Mongoose client
 */
export async function connect (context: Context) {
  if (!connection) {
    const mongoOptions: mongoose.ConnectOptions = {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
      dbName: 'ado_dlp',
      useFindAndModify: false,
      ssl: process.env.MONGO_SSL === 'true'
    }
    connection = await mongoose.connect(
      process.env.COSMOS_MONGO_CONNECTION_STRING!,
      mongoOptions
    )
    await setupModels(connection, context)
  }
  return connection
}
