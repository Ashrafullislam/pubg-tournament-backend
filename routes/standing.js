import express from 'express'
import { database } from '../models/database.js'
import { ObjectId } from 'mongodb'

const router = express.Router()

router.get('/match', async (req, res) => {
  try {
    const teams = []
    const standings = {}
    const result = await database.collection('matches').aggregate([
      {
        $match: { _id: new ObjectId(req.query['match-id']) }
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
            }
          ]
        }
      }
    ]).toArray()
    result.at(0).teams.forEach(team => teams.push({ id: team._id, name: team.name }))
    teams.forEach(team => {
      standings[result.at(0)[team.id]] = result.at(0).teams.find(i => i._id === team.id)
    })
    res.json(standings)
    // res.json(result)
    // result.at(0).teams.forEach(team => teams.push(team.name))
  } catch (e) {
    console.error(e)
    res.sendStatus(500)
  } finally {
  }
})

router.get('/fragger', async (req, res) => {
  try {
    const players = []
    const result = await database.collection('matches').aggregate([
      {
        $match: { _id: new ObjectId(req.query['match-id']) }
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
            }
          ]
        }
      }
    ]).toArray()
    result.forEach(match => match.teams.forEach(team => team.players.forEach(player => players.push(player))))
    const sortedPlayers = players.sort((a, b) => b?.kills?.[req.query['match-id']] - a?.kills?.[req.query['match-id']])
    res.json(sortedPlayers)
  } catch (e) {
    console.error(e)
    res.sendStatus(500)
  }
})

router.get('/overall', async (req, res) => {
  try {
    const matches = []
    const players = []
    const result = await database.collection('stages').aggregate([
      {
        $match: { 'tournament-id': new ObjectId(req.query['tournament-id']) }
      },
      {
        $lookup: {
          from: 'matches',
          localField: '_id',
          foreignField: 'stage-id',
          as: 'matches',
          pipeline: [
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
                  }
                ]
              }
            }
          ]
        }
      }
    ]).toArray()

    result.forEach(stage => {
      stage.matches.forEach(match => {
        matches.push(match._id)
        match.teams.forEach(team => {
          team.players.forEach(player => {
            players.push(player._id)
          })
        })
      })
    })

    const playersResult = await database.collection('players').find({
      '_id': { $in: players.map(player => new ObjectId(player)) }
    }).toArray()

    const newMatches = matches.map(match => match.toString())
    const newPlayers = playersResult.map(player => {
      const newPlayer = structuredClone(player)
      newPlayer._id = player._id
      newPlayer.kills = Object.keys(newPlayer.kills).reduce((a, b) => {
        return newMatches.includes(a) ? player.kills[a] : 0 || 0 + newMatches.includes(b) ? player.kills[b] : 0 || 0
      }, Object.keys(newPlayer.kills).at(0))
      return newPlayer
    })
    const sortedPlayers = newPlayers.sort((a, b) => b.kills - a.kills)

    res.send(sortedPlayers)
  } catch (e) {
    console.error(e)
    res.sendStatus(500)
  }
})

export default router
