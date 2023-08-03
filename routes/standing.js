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
    const newStandings = Object.keys(standings).map(index => {
      const newObj = standings[index]
      newObj.rank = Number(index)
      return newObj
    })
    const newStandingsWithKills = newStandings.map(i => {
      const newObj = structuredClone(i)
      newObj._id = i._id.toString()
      let kills = 0
      i?.players?.forEach(player => {
        Object.keys(player?.kills).forEach(j => {
          if (j.toString() === req.query['match-id']) kills += player.kills[j]
        })
      })
      newObj.kills = kills
      return newObj
    })
    res.json(newStandingsWithKills)
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
    const teams2 = []
    const matchIds = []
    const result2 = await database.collection('matches').aggregate([
      {
        $match: { 'stage-id': new ObjectId(req.query['stage-id']) }
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
    result2.forEach(match => match.teams.forEach(team => teams2.push(team)))
    result2.forEach(match => matchIds.push(match._id))
    const totalKills = []
    const totalTeamKills = []
    const tempMatchIds = matchIds.map(i => i?.toString())
    result2?.forEach(i => {
      i?.teams?.forEach(team => {
        team?.players?.forEach(player => {
          Object.keys(player.kills).forEach(i => {
            if (tempMatchIds.includes(i.toString())) {
              totalKills.push({
                playerId: player?._id?.toString(),
                matchId: i,
                kills: player?.kills[i],
                teamId: team?._id?.toString()
              })
            }
          })
        })
      })
    })
    for (let i of totalKills) {
      if (!totalTeamKills.find(j => j.id === i.teamId)) {
        totalTeamKills.push({ id: i?.teamId, kills: i?.kills })
      }
      else {
        const objIndex = totalTeamKills.findIndex(j => j?.id === i?.teamId)
        const tempObj = structuredClone(totalTeamKills[objIndex])
        tempObj.kills += i?.kills || 0
        totalTeamKills.splice(objIndex, 1, tempObj)
      }
    }
    const newMatchIds = matchIds.map(id => id.toString())
    const filteredTeams = teams2.map(team => {
      const newTeam = structuredClone(team)
      const pointsArray = Object.keys(newTeam?.points).map(point => ({ matchId: point, points: newTeam?.points?.[point] }))
      const newPointsArray = pointsArray.filter(arr => newMatchIds.includes(arr.matchId))
      newTeam._id = team._id
      // delete newTeam.players
      newTeam.points = newPointsArray.reduce((a, b) => ((a.points || a) + b.points), 0)
      return newTeam
    })
    const sortedTeams = filteredTeams.sort((a, b) => b.points - a.points)
    let mergedTeams = []
    sortedTeams.forEach(team => {
      const team2 = structuredClone(team)
      team2._id = team._id.toString()
      if (!mergedTeams.some(mergedTeam => mergedTeam._id.toString() === team._id.toString())) mergedTeams.push(team2)
      else {
        const arrIndex = mergedTeams.findIndex(mergedTeam => mergedTeam._id.toString() === team._id.toString())
        const objToBeReplaced = structuredClone(mergedTeams[arrIndex])
        objToBeReplaced.points += team.points
        mergedTeams.splice(arrIndex, 1, objToBeReplaced)
      }
    })
    const mergedTeams2 = mergedTeams.map(i => {
      const clonedObj = structuredClone(i)
      clonedObj._id = i._id.toString()
      clonedObj.kills = totalTeamKills.find(j => j.id === i._id).kills
      return clonedObj
    })
    return res.send(mergedTeams2)

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

// router.get('/overall-standing', async (req, res) => {
//   const result = await database.collection('tournaments').aggregate([
//     {
//       $match: { '_id': new ObjectId(req.query['tournament-id']) }
//     }
//   ]).toArray()
//   res.send(result)
// })

export default router
