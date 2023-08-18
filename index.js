import cors from "cors";
import express from "express";
import http from "http";
import morgan from "morgan";
import { Server } from "socket.io";
import stageRouter from "./routes/group-stage.js";
import matchRouter from "./routes/match.js";
import standingRouter from "./routes/standing.js";
import teamRouter from "./routes/team.js";
import tournamentRouter from "./routes/tournament.js";
import { handleSocketConnection } from "./socket-handler.js";

const app = express();

// middlewares
app.use(morgan("dev"));

const server = http.createServer(app);
const socketConnection = new Server(server, {
  cors: {
    origin: "*",
    methods: "*",
    allowedHeaders: "*",
    optionsSuccessStatus: 200,
  },
});

handleSocketConnection(socketConnection);

app.use(cors());
app.use(express.json());
app.use("/tournaments", tournamentRouter);
app.use("/matches", matchRouter);
app.use("/teams", teamRouter);
app.use("/stages", stageRouter);
app.use("/standings", standingRouter);

app.get("/", (_req, res) => {
  res.send("Running...");
});

server.listen(8000, () => console.log("running..."));
