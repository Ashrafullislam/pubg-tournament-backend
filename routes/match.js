import express from 'express'
import mongoClient, { database } from '../models/database.js'

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
  if (!req.body.name || !req.body.logo || !req.body.time) return res.sendStatus(400)

  try {
    await mongoClient.connect()
    const result = await database.collection('matches').insertOne(req.body)
    result?.insertedId ? res.json({ success: true }) : res.json({ success: false })
  } catch (e) {
    console.error(e)
    res.sendStatus(500)
  } finally {
    await mongoClient.close()
  }
})

export default router
