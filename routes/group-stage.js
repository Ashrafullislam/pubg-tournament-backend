import express from 'express'
import mongoClient, { database } from '../models/database.js'
import { ObjectId } from 'mongodb'

const router = express.Router()

router.get('/', async (_req, res) => {
  try {
    await mongoClient.connect()
    const result = await database.collection('stages').find().toArray()
    res.json(result)
  } catch (e) {
    console.error(e)
    res.sendStatus(500)
  } finally {
    await mongoClient.close()
  }
})

router.post('/', async (req, res) => {
  if (!req.body['tournament-id']) return res.send(400)
  const bodyData = structuredClone(req.body)
  bodyData['tournament-id'] = new ObjectId(bodyData['tournament-id'])

  try {
    await mongoClient.connect()
    const result = await database.collection('stages').insertOne(bodyData)
    result?.acknowledged ? res.json({ success: true }) : res.json({ success: false })
  } catch (e) {
    console.error(e)
    res.sendStatus(500)
  } finally {
    await mongoClient.close()
  }
})

export default router
