import express from 'express'
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors'
import tournamentRouter from './routes/tournament.js'
import matchRouter from './routes/match.js'
import teamRouter from './routes/team.js'
import stageRouter from './routes/group-stage.js'
import standingRouter from './routes/standing.js'
import { handleSocketConnection } from './socket-handler.js';

const app = express()
const server = http.createServer(app);
const socketConnection = new Server(server, {
  cors: {
    origin: "*",
    methods: "*",
    allowedHeaders: "*",
    optionsSuccessStatus: 200,
  }
} );

handleSocketConnection(socketConnection);

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

server.listen(8000, () => console.log('running...'))
