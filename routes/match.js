import express from 'express'
import mongoClient, { database } from '../models/database.js'
import { ObjectId } from 'mongodb'

const router = express.Router()

router.get('/', async (_req, res) => {
  try {
    await mongoClient.connect()
    const result = await database.collection('matches').find().toArray()
    res.json(result)
  } catch (e) {
    console.error(e)
    res.sendStatus(500)
  } finally {
    await mongoClient.close()
  }
})

router.post('/', async (req, res) => {
  if (!req.body.name || !req.body.logo || !req.body.time || !req.body['stage-id']) return res.sendStatus(400)
  const bodyData = structuredClone(req.body)
  bodyData['stage-id'] = new ObjectId(bodyData['stage-id'])

  try {
    await mongoClient.connect()
    const result = await database.collection('matches').insertOne(bodyData)
    result?.acknowledged ? res.json({ success: true }) : res.json({ success: false })
  } catch (e) {
    console.error(e)
    res.sendStatus(500)
  } finally {
    await mongoClient.close()
  }
})

export default router
