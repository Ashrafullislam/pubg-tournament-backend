import express from 'express'
import cors from 'cors'
import tournamentRouter from './routes/tournament.js'

const app = express()

app.use(cors())
app.use(express.json())
app.use('/tournaments', tournamentRouter)

app.listen(8000, () => console.log('running...'))
