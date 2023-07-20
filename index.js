import express from 'express'
import cors from 'cors'
import tournamentRouter from './routes/tournament.js'
import matchRouter from './routes/match.js'
import teamRouter from './routes/team.js'
import stageRouter from './routes/group-stage.js'
import standingRouter from './routes/standing.js'

const app = express()

app.use(cors())
app.use(express.json())
app.use('/tournaments', tournamentRouter)
app.use('/matches', matchRouter)
app.use('/teams', teamRouter)
app.use('/stages', stageRouter)
app.use('/standings', standingRouter)

app.get('/', (_req, res) => {
  res.send('Running...')
})

app.listen(8000, () => console.log('running...'))
