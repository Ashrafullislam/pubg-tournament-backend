import express from 'express'
import { database } from '../models/database.js'
import { ObjectId } from 'mongodb'

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

router.get('/all', async (req, res) => {
  try {
    const result = await database.collection('tournaments').aggregate([
      {
        $project: { 'logo': 0 }
      },
      {
        $lookup: {
          from: 'stages',
          localField: '_id',
          foreignField: 'tournament-id',
          as: 'stages',
          pipeline: [
            {
              $lookup: {
                from: 'matches',
                localField: '_id',
                foreignField: 'stage-id',
                as: 'matches'
              }
            },
            {
              $project: {
                matches: { 'stage-id': 0, logo: 0 }
              }
            }
          ]
        }
      },
      {
        $project: {
          stages: { 'tournament-id': 0 }
        }
      }
    ]).toArray()
    res.json(result)
  } catch (e) {
    console.error(e)
    res.sendStatus(500)
  }
})

router.get('/:id', async (req, res) => {
  try {
    const result = await database.collection('tournaments').find({ '_id': new ObjectId(req.params.id) }).toArray()
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

router.delete('/:id', async (req, res) => {
  try {
    const result = await database.collection('tournaments').deleteOne({ '_id': new ObjectId(req.params.id) })
    result?.acknowledged ? res.json({ success: true }) : res.json({ success: false })
  } catch (e) {
    console.log(e)
    res.sendStatus(500)
  }
})

router.put('/', async (req, res) => {
  try {
    const result = await database.collection('tournaments').updateOne(
      { '_id': new ObjectId(req.query['tournament-id']) },
      { $set: req.body }
    )
    result?.acknowledged ? res.json({ success: true }) : res.json({ success: false })
  } catch (e) {
    console.log(e)
    res.sendStatus(500)
  }
})

export default router
