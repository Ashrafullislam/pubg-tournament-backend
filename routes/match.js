import express from "express";
import { ObjectId } from "mongodb";
import collections from "../constants/collections.js";
import { socketEvents } from "../constants/socket-events.js";
import { socketConnection } from "../index.js";
import { database } from "../models/database.js";

const router = express.Router();

router.get("/next", async (req, res) => {
  console.log(req.query["match-id"], "match id find ");
  try {
    const result = await database.collection("matches").find().toArray();
    const arrayWithDateAdded = result.map((match) => {
      const newMatch = structuredClone(match);
      const date = newMatch.date.split("-").reverse().join("-");
      const time = newMatch.time;
      const dateAndTime = new Date(date + "T" + time);
      newMatch.dateAndTime = dateAndTime;
      return newMatch;
    });
    arrayWithDateAdded.sort((a, b) => b.dateAndTime - a.dateAndTime);
    const currentMatchIndex = arrayWithDateAdded.findIndex(
      (i) => i._id === req.query["match-id"]
    );

    const removedDateAndTime = arrayWithDateAdded.map((match) => {
      const newMatch = structuredClone(match);
      delete newMatch.dateAndTime;
      return newMatch;
    });
    res.send(removedDateAndTime[currentMatchIndex + 1]);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

async function getMatches(req, res) {
  const aggArray = [
    {
      $lookup: {
        from: "teams",
        localField: "teams",
        foreignField: "_id",
        as: "teams",
        pipeline: [
          {
            $lookup: {
              from: "players",
              localField: "players",
              foreignField: "_id",
              as: "players",
            },
          },
        ],
      },
    },
  ];

  console.log(req.params.id, "id");
  if (req.params.id)
    aggArray.splice(0, 0, { $match: { _id: new ObjectId(req.params.id) } });
  else if (req.query["stage-id"])
    aggArray.splice(0, 0, {
      $match: { "stage-id": new ObjectId(req.query["stage-id"]) },
    });

  try {
    const result = await database
      .collection("matches")
      .aggregate(aggArray)
      .skip((req.query["page-number"] || 0) * 10)
      .limit(10)
      .toArray();
    res.json(result);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  } finally {
  }
}

router.get("/", getMatches);
router.get("/:id", getMatches);

router.post("/", async (req, res) => {
  if (!req.body["stage-id"]) return res.sendStatus(400);
  const bodyData = structuredClone(req.body);
  bodyData["stage-id"] = new ObjectId(bodyData["stage-id"]);

  try {
    const result = await database.collection("matches").insertOne(bodyData);
    result?.acknowledged
      ? res.json({ success: true })
      : res.json({ success: false });
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  } finally {
  }
});

router.post("/kills", async (req, res) => {
  console.log("Kills calling.....");
  if (!req.body["match-id"] || !req.body["player-id"])
    return res.sendStatus(400);
  const objectKey = `kills.${req.body["match-id"]}`;

  console.log("Team Id: ", req.body.teamId);

  try {
    const result = await database.collection("players").updateOne(
      { _id: new ObjectId(req.body["player-id"]) },
      {
        $set: { [objectKey]: req.body.kills },
      },
      { upsert: true }
    );

    // update the summary
    const summaryResult = await database
      .collection(collections.SUMMARY)
      .findOne({ matchId: req.body["match-id"] });

    const teamIndex = summaryResult.teams.findIndex(
      (team) => team._id.toString() === req.body.teamId
    );

    // update the team total kills
    summaryResult.teams[teamIndex].totalKills =
      req.body.type === "increase"
        ? summaryResult.teams[teamIndex].totalKills + 1
        : summaryResult.teams[teamIndex].totalKills - 1;

    // save the updated summary
    const updatedSummaryResult = await database
      .collection(collections.SUMMARY)
      .updateOne(
        { matchId: req.body["match-id"] },
        {
          $set: { teams: summaryResult.teams },
        },
        { upsert: true }
      );

    // get the updated summary, only the teams that is req.body.teamId
    const updatedSummary = await database
      .collection(collections.SUMMARY)
      .findOne({ matchId: req.body["match-id"] });

    console.log("updated summary", updatedSummary?.teams[teamIndex]);

    // send to the client via socket
    socketConnection.emit(
      socketEvents.UPDATE_KILLS,
      updatedSummary?.teams[teamIndex]
    );

    result?.acknowledged
      ? res.json({ success: true })
      : res.json({ success: false });
  } catch (e) {
    console.log(e);
  }
});

router.post("/add-team", async (req, res) => {
  if (!req.body.teamsPayload["match-id"]) return res.sendStatus(400);
  const teams = structuredClone(req.body.teamsPayload.teams).map(
    (team) => new ObjectId(team)
  );

  try {
    const result = await database.collection("matches").updateOne(
      { _id: new ObjectId(req.body.teamsPayload["match-id"]) },
      {
        $set: { teams },
      },
      { upsert: true }
    );

    // add a match summary collection for each team
    const matchSummary = {
      matchId: req.body.teamsPayload["match-id"],
      teams: req.body.teams,
    };
    const matchSummaryResult = await database
      .collection(collections.SUMMARY)
      .insertOne(matchSummary);

    console.log("match summary result", matchSummaryResult);

    result?.acknowledged
      ? res.json({ success: true })
      : res.json({ success: false });
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  } finally {
  }
});

router.post("/rank", async (req, res) => {
  try {
    const result = await database.collection("matches").updateOne(
      { _id: new ObjectId(req.body["match-id"]) },
      {
        $set: {
          [req.body["team-id"]]: req.body.rank,
        },
      },
      { upsert: true }
    );
    result?.acknowledged
      ? res.json({ success: true })
      : res.json({ success: false });
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await database
      .collection("matches")
      .deleteOne({ _id: new ObjectId(req.params.id) });
    result?.acknowledged
      ? res.json({ success: true })
      : res.json({ success: false });
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

router.post("/dead", async (req, res) => {
  const addToDead = {
    $addToSet: {
      dead: {
        $each: [req.body["player-id"]],
      },
    },
  };
  const removeFromDead = {
    $pull: {
      dead: req.body["player-id"],
    },
  };

  try {
    const result = await database
      .collection("matches")
      .updateOne(
        { _id: new ObjectId(req.body["match-id"]) },
        req.body.dead ? addToDead : removeFromDead,
        { upsert: true }
      );
    result?.acknowledged
      ? res.json({ success: true })
      : res.json({ success: false });
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

router.post("/points", async (req, res) => {
  try {
    const result = await database.collection("teams").updateOne(
      { _id: new ObjectId(req.body["team-id"]) },
      {
        $set: { [`points.${req.body["match-id"]}`]: req.body.points },
      },
      { upsert: true }
    );
    result?.acknowledged
      ? res.json({ success: true })
      : res.json({ success: false });
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

router.put("/", async (req, res) => {
  try {
    const result = await database
      .collection("matches")
      .updateOne(
        { _id: new ObjectId(req.query["match-id"]) },
        { $set: req.body }
      );
    result?.acknowledged
      ? res.json({ success: true })
      : res.json({ success: false });
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

export default router;
