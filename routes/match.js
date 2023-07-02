import express from 'express'
import mongoClient, { database } from '../models/database.js'
import { ObjectId } from 'mongodb'

const router = express.Router()

async function getMatches(req, res) {
  try {
    const result = await database.collection('matches').aggregate([
      {
        $match: {
          $or: [
            { 'stage-id': new ObjectId(req.query['stage-id']) },
            // { '_id': new ObjectId(req.params.id) },
            // { '_id': { $exists: true } }
          ]
        }
      },
      {
        $lookup: {
          from: 'teams',
          localField: 'teams',
          foreignField: '_id',
          as: 'teams',
          pipeline: [
            {
              $lookup: {
                from: 'players',
                localField: 'players',
                foreignField: '_id',
                as: 'players'
              }
            },
          ]
        }
      }
    ]).toArray()
    res.json(result)
  } catch (e) {
    console.error(e)
    res.sendStatus(500)
  } finally {
  }

}

router.get('/', getMatches)
router.get('/:id', getMatches)

router.post('/', async (req, res) => {
  if (!req.body.name || !req.body['stage-id']) return res.sendStatus(400)
  const bodyData = structuredClone(req.body)
  bodyData['stage-id'] = new ObjectId(bodyData['stage-id'])

  try {
    const result = await database.collection('matches').insertOne(bodyData)
    result?.acknowledged ? res.json({ success: true }) : res.json({ success: false })
  } catch (e) {
    console.error(e)
    res.sendStatus(500)
  } finally {
  }
})

router.post('/add-team', async (req, res) => {
  if (!req.body['match-id']) return res.sendStatus(400)
  const teams = structuredClone(req.body.teams).map(team => new ObjectId(team))

  try {
    const result = await database.collection('matches').updateOne(
      { _id: new ObjectId(req.body['match-id']) },
      {
        $addToSet:
        {
          teams:
            { $each: teams }
        }
      },
      { upsert: true })
    result?.acknowledged ? res.json({ success: true }) : res.json({ success: false })
  } catch (e) {
    console.error(e)
    res.sendStatus(500)
  } finally {
  }
})

export default router
