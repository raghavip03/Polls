import { Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";


// Require type checking of request body.
type SafeRequest = Request<ParamsDictionary, {}, Record<string, unknown>>;
type SafeResponse = Response;  // only writing, so no need to check

//Description of an indiviudal poll
// RI:
export type Poll = {
  pollName: string;
  endTime: number;
  options: string[];
  voterName: string;
  totalVotes: number;
  optionObj: Option[];
  voteObj: VoteInfo[];
 }
 export type Option = {
   optionName: string,
   optionVotes: number
 }

 export type VoteInfo = {
    voterName: string,
    votedFor: string,
}
//Map to store Poll Name to Poll Details
const pollMap: Map<string, Poll> = new Map();

/** Testing function to reset previously added Polls. */
export const resestForTesting = (): void => {
  pollMap.clear();
};

//sort polls
const comparePolls = (a: Poll, b: Poll): number => {
  const now: number = Date.now();
  const endA = now <= a.endTime ? a.endTime : 1e15 - a.endTime;
  const endB = now <= b.endTime ? b.endTime : 1e15 - b.endTime;
  return endA - endB;
};

/** Testing function to move all end times forward the given amount (of ms). */
export const advanceTimeForTesting = (ms: number): void => {
  for (const poll of pollMap.values()) {
    poll.endTime -= ms;
  }
};

/**
 * Returns a list of all polls, sorted in descending order
 * @param _req the request
 * @param res the response
 */
export const listPolls = (_req: SafeRequest, res: SafeResponse): void => {
  const values = Array.from(pollMap.values());
  values.sort(comparePolls);
  res.send({polls: values});
}

/**
 * Adds polls to the list
 * @oaram req the request
 * @param res the response
 */
export const addPoll = (req: SafeRequest, res: SafeResponse): void => {
  const name = req.body.name;
  if(typeof name !== "string") {
    res.status(400).send("missing 'name' parameter");
    return;
  }
  const minutes = req.body.minutes;
  if(typeof minutes !== "number") {
    res.status(400).send(`'minutes' are not a number: ${minutes}`);
    return;
  } else if(isNaN(minutes) || minutes < 1 || Math.round(minutes) !== minutes) {
    res.status(400).send(`'minutes' are not a positive integer: ${minutes}`);
    return;
  }

  const optionsGiven = req.body.options;
  if(!Array.isArray(optionsGiven)) {
    res.status(400).send('options are given in the wrong format');
    return;
  }

  if(pollMap.has(name)) {
    res.status(400).send(`poll for '${name}' already exists`);
    return;
  }
  const optionObj: Option[] = [];
  for (const optionName of optionsGiven) {
    optionObj.push({
      optionName,
      optionVotes: 0,
    });
  }
  const voteInfo: VoteInfo = {
    voterName: name,
    votedFor: name
  };

  const poll: Poll = {
    pollName: name,
    endTime: Date.now() + minutes * 60 * 1000,
    options: optionsGiven,
    voterName: name,
    totalVotes: 0,
    optionObj: optionObj,
    voteObj: [voteInfo]
  };

  pollMap.set(poll.pollName, poll);
  res.send({poll: poll});
};

/**
 * Updates poll with votes
 * @oaram req the request
 * @param res the response
 */
export const updatePoll = (req: SafeRequest, res: SafeResponse): void => {
  const voterName = req.body.voterName;
  if (typeof voterName !== "string") {
    res.status(400).send("missing 'name' parameter");
    return;
  }

  const pollName = req.body.pollName;
  if (typeof pollName !== "string") {
    res.status(400).send("missing or invalid name parameter");
    return;
  }

  const poll = pollMap.get(pollName);
  if (poll === undefined) {
    res.status(400).send(`no auction with name ${pollName}`);
    return;
  }

  const now = Date.now();
  if (now >= poll.endTime) {
    res.status(400).send(`auction for "${pollName}" has already ended`);
    return;
  }
  let totalVotes = poll.totalVotes + 1;
  const chosenOption = req.body.chosenOption;
  if (typeof chosenOption !== "string") {
    res.status(400).send("missing or invalid name parameter");
    return;
  }
  const optionUpdate: Option[] = [];
  const info: VoteInfo[] = [];
  let hasVotedBefore = false;

  for (const option of poll.optionObj) {
    if (option.optionName === chosenOption) {
      optionUpdate.push({
        optionName: chosenOption,
        optionVotes: option.optionVotes + 1,
      });
    } else {
      let foundVote = false;
      for (const vote of poll.voteObj) {
        if (vote.voterName === voterName && vote.votedFor === option.optionName) {
          optionUpdate.push({
            optionName: option.optionName,
            optionVotes: option.optionVotes - 1,
          });
          totalVotes = totalVotes - 1;
          foundVote = true;
        }
      }
      if (!foundVote) {
        optionUpdate.push(option);
      }
    }
  }

  if (!hasVotedBefore) {
    info.push({
      voterName: voterName,
      votedFor: chosenOption,
    });
  }

  poll.voterName = voterName;
  poll.totalVotes = totalVotes;
  poll.optionObj = optionUpdate;
  poll.voteObj = info;
  res.send({ poll: poll });
};

/**
 * Loads the current state of the poll
 * @param req the request
 * @param req the response
 */
export const getPoll = (req: SafeRequest, res: SafeResponse): void => {
  const name = req.body.name;
  if (typeof name !== "string") {
    res.status(400).send("missing or invalid 'name' parameter");
    return;
  }
  const poll = pollMap.get(name);
  if (poll === undefined) {
    res.status(400).send(`no poll with the name '${name}'`);
    return;
  }
  res.send({poll: poll});
};

