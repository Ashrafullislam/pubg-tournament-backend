import express from 'express'
import mongoClient, { database } from '../models/database.js'

const router = express.Router()

router.get('/', async (_req, res) => {
  try {
    const result = await database.collection('tournaments').find().toArray()
    res.json(result)
  } catch (e) {
    console.error(e)
    res.sendStatus(500)
  } finally {
  }
})

router.post('/', async (req, res) => {
  if (!req.body.name || !req.body.logo) return res.sendStatus(400)

  try {
    const result = await database.collection('tournaments').insertOne(req.body)
    result?.acknowledged ? res.json({ success: true }) : res.json({ success: false })
  } catch (e) {
    console.error(e)
    res.sendStatus(500)
  } finally {
  }
})

export default router
