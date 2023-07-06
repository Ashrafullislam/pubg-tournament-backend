import express from 'express'
import { database } from '../models/database.js'
import { ObjectId } from 'mongodb'

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

router.get('/:id', async (_req, res) => {
  try {
    const result = await database.collection('teams').aggregate([
      {
        $match: { '_id': new ObjectId(req.params.id) }
      },
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

router.delete('/', async (req, res) => {
  try {
    const result = await database.collection('players').deleteOne({ '_id': new ObjectId(req.body.id) })
    result?.acknowledged ? res.json({ success: true }) : res.json({ success: false })
  } catch (e) {
    console.log(e)
    res.sendStatus(500)
  }
})

export default router
