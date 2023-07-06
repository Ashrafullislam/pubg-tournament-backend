import express from 'express'
import { database } from '../models/database.js'
import { ObjectId } from 'mongodb'

const router = express.Router()

async function getMatches(req, res) {
  const aggArray = [
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
  ]

  if (req.params.id) aggArray.splice(0, 0, { $match: { '_id': new ObjectId(req.params.id) } })
  else if (req.query['stage-id']) aggArray.splice(0, 0, { $match: { 'stage-id': new ObjectId(req.query['stage-id']) } })

  try {
    const result = await database.collection('matches').aggregate(aggArray).toArray()
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
  if (!req.body['stage-id']) return res.sendStatus(400)
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

router.post('/kills', async (req, res) => {
  if (!req.body['match-id'] || !req.body['player-id']) return res.sendStatus(400)

  try {
    const result = await database.collection('players').updateOne(
      { "_id": new ObjectId(req.body['player-id']) },
      {
        $set: {
          [req.body['match-id']]: req.body.kills
        }
      },
      { upsert: true }
    )
    result?.acknowledged ? res.json({ success: true }) : res.json({ success: false })
  } catch (e) {
    console.log(e)
  }
})

router.post('/add-team', async (req, res) => {
  if (!req.body['match-id']) return res.sendStatus(400)
  const teams = structuredClone(req.body.teams).map(team => new ObjectId(team))

  try {
    const result = await database.collection('matches').updateOne(
      { _id: new ObjectId(req.body['match-id']) },
      {
        $set: { teams }
      },
      { upsert: true })
    result?.acknowledged ? res.json({ success: true }) : res.json({ success: false })
  } catch (e) {
    console.error(e)
    res.sendStatus(500)
  } finally {
  }
})

router.post('/rank', async (req, res) => {
  try {
    const result = await database.collection('matches').updateOne(
      { _id: new ObjectId(req.body['match-id']) },
      {
        $set: {
          [req.body['team-id']]: req.body.rank
        }
      },
      { upsert: true }
    )
    result?.acknowledged ? res.json({ success: true }) : res.json({ success: false })
  } catch (e) {
    console.log(e)
    res.sendStatus(500)
  }
})

router.delete('/', async (req, res) => {
  try {
    const result = await database.collection('matches').deleteOne({ '_id': new ObjectId(req.body.id) })
    result?.acknowledged ? res.json({ success: true }) : res.json({ success: false })
  } catch (e) {
    console.log(e)
    res.sendStatus(500)
  }
})

export default router
