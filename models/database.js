import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'
dotenv.config()

const client = new MongoClient(process.env.DBURL)
await client.connect()
const database = client.db('pubgm-tournaments')

export default client
export { database }
