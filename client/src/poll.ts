import { isRecord } from "./record";

//Description of an individual poll
export type Poll = {
  readonly pollName: string;
  readonly endTime: number;
  readonly options: string[];
  readonly voterName: string;
  readonly totalVotes: number;
  readonly optionObj: Option[],
  readonly voteObj: VoteInfo[],
}
export type Option = {
  readonly optionName: string,
  readonly optionVotes: number
}
export type VoteInfo = {
  readonly voterName: string,
  readonly votedFor: string,
}
/**
 * Parses unkown data into a Poll. Will log an error and return undefined
 * if it is not a valid Poll
 * @param val unkown data to parse into a poll
 * @returns Poll if val is a valid Poll and undefined otherwise
 */
export const parsePoll = (val: unknown): undefined | Poll => {
  if(!isRecord(val)) {
    console.error("not a poll", val)
    return undefined
  }
  if(typeof val.pollName !== "string") {
    console.error("not a poll: missing 'name of poll'", val)
    return undefined;
  }
  if(typeof val.voterName !== "string") {
    console.log("not a poll: missing 'voter name'", val)
    return undefined;
  }
  if(typeof val.endTime !== "number" || val.endTime < 0 || isNaN(val.endTime)) {
    console.error("not a poll: missing or invalid 'minutes'", val)
    return undefined;
  }
  if(!Array.isArray(val.options)) {
    console.error("options needs to be an array");
    return undefined;
  }
  if(!Array.isArray(val.optionObj)) {
    console.error("optionsObj needs to be an array");
    return undefined;
  }
  if(typeof val.voterName !== "string") {
    console.error("not a poll: missing 'name of voterName'", val)
    return undefined;
  }
  if(typeof val.totalVotes !== "number" || val.totalVotes < 0 || isNaN(val.totalVotes)) {
    console.error("not a poll: missing or invalid 'totalVotes'", val)
    return undefined;
  }
  if(!Array.isArray(val.voteObj)) {
    console.error("voteObj needs to be an array");
    return undefined;
  }
  return {
    pollName: val.pollName, options: val.options, endTime: val.endTime, optionObj: val.optionObj, voterName: val.voterName, totalVotes: val.totalVotes, voteObj: val.voteObj
  }


}
