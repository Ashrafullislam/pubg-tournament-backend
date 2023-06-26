import express from 'express'
import mongoClient, { database } from '../models/database.js'

const router = express.Router()

router.get('/', async (_req, res) => {
  try {
    await mongoClient.connect()
    const result = await database.collection('teams').find().toArray()
    res.json(result)
  } catch (e) {
    console.error(e)
    res.sendStatus(500)
  } finally {
    await mongoClient.close()
  }
})

router.post('/', async (req, res) => {
  try {
    await mongoClient.connect()
    const result = await database.collection('teams').insertOne(req.body)
    result?.insertedId ? res.json({ success: true }) : res.json({ success: false })
  } catch (e) {
    console.error(e)
    res.sendStatus(500)
  } finally {
    await mongoClient.close()
  }
})

export default router
