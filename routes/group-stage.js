import express from 'express'
import mongoClient, { database } from '../models/database.js'
import { ObjectId } from 'mongodb'

const router = express.Router()

router.get('/', async (req, res) => {
  const tournamentId = req.query['tournament-id']

  try {
    const result = await database.collection('stages').find(tournamentId ? { 'tournament-id': new ObjectId(tournamentId) } : {}).toArray()
    res.json(result)
  } catch (e) {
    console.error(e)
    res.sendStatus(500)
  } finally {
  }
})

router.post('/', async (req, res) => {
  if (!req.body['tournament-id']) return res.sendStatus(400)
  const bodyData = structuredClone(req.body)
  bodyData['tournament-id'] = new ObjectId(bodyData['tournament-id'])

  try {
    const result = await database.collection('stages').insertOne(bodyData)
    result?.acknowledged ? res.json({ success: true }) : res.json({ success: false })
  } catch (e) {
    console.error(e)
    res.sendStatus(500)
  } finally {
  }
})

export default router
