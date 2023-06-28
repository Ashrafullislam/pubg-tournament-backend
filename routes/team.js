import express from 'express'
import mongoClient, { database } from '../models/database.js'

const router = express.Router()

router.get('/', async (_req, res) => {
  try {
    const result = await database.collection('teams').aggregate([
      {
        $lookup: {
          from: 'players',
          localField: 'players',
          foreignField: '_id',
          as: 'players'
        }
      }
    ]).toArray()
    res.json(result)
  } catch (e) {
    console.error(e)
    res.sendStatus(500)
  } finally {
  }
})

router.post('/', async (req, res) => {
  const bodyData = structuredClone(req.body)

  try {
    const playerResult = await database.collection('players').insertMany(req.body.players)
    const playerIds = Object.values(playerResult.insertedIds)
    bodyData.players = playerIds
    const result = await database.collection('teams').insertOne(bodyData)
    result?.acknowledged ? res.json({ success: true }) : res.json({ success: false })
  } catch (e) {
    console.error(e)
    res.sendStatus(500)
  } finally {
  }
})

export default router
