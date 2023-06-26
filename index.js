import express from 'express'
import cors from 'cors'
import tournamentRouter from './routes/tournament.js'
import matchRouter from './routes/match.js'
import teamRouter from './routes/team.js'

const app = express()

app.use(cors())
app.use(express.json())
app.use('/tournaments', tournamentRouter)
app.use('/matches', matchRouter)
app.use('/teams', teamRouter)

app.listen(8000, () => console.log('running...'))
