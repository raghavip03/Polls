"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPoll = exports.updatePoll = exports.addPoll = exports.listPolls = exports.advanceTimeForTesting = exports.resestForTesting = void 0;
//Map to store Poll Name to Poll Details
var pollMap = new Map();
/** Testing function to reset previously added Polls. */
var resestForTesting = function () {
    pollMap.clear();
};
exports.resestForTesting = resestForTesting;
//sort polls
var comparePolls = function (a, b) {
    var now = Date.now();
    var endA = now <= a.endTime ? a.endTime : 1e15 - a.endTime;
    var endB = now <= b.endTime ? b.endTime : 1e15 - b.endTime;
    return endA - endB;
};
/** Testing function to move all end times forward the given amount (of ms). */
var advanceTimeForTesting = function (ms) {
    var e_1, _a;
    try {
        for (var _b = __values(pollMap.values()), _c = _b.next(); !_c.done; _c = _b.next()) {
            var poll = _c.value;
            poll.endTime -= ms;
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
};
exports.advanceTimeForTesting = advanceTimeForTesting;
/**
 * Returns a list of all polls, sorted in descending order
 * @param _req the request
 * @param res the response
 */
var listPolls = function (_req, res) {
    var values = Array.from(pollMap.values());
    values.sort(comparePolls);
    res.send({ polls: values });
};
exports.listPolls = listPolls;
/**
 * Adds polls to the list
 * @oaram req the request
 * @param res the response
 */
var addPoll = function (req, res) {
    var e_2, _a;
    var name = req.body.name;
    if (typeof name !== "string") {
        res.status(400).send("missing 'name' parameter");
        return;
    }
    var minutes = req.body.minutes;
    if (typeof minutes !== "number") {
        res.status(400).send("'minutes' are not a number: ".concat(minutes));
        return;
    }
    else if (isNaN(minutes) || minutes < 1 || Math.round(minutes) !== minutes) {
        res.status(400).send("'minutes' are not a positive integer: ".concat(minutes));
        return;
    }
    var optionsGiven = req.body.options;
    if (!Array.isArray(optionsGiven)) {
        res.status(400).send('options are given in the wrong format');
        return;
    }
    if (pollMap.has(name)) {
        res.status(400).send("poll for '".concat(name, "' already exists"));
        return;
    }
    var optionObj = [];
    try {
        for (var optionsGiven_1 = __values(optionsGiven), optionsGiven_1_1 = optionsGiven_1.next(); !optionsGiven_1_1.done; optionsGiven_1_1 = optionsGiven_1.next()) {
            var optionName = optionsGiven_1_1.value;
            optionObj.push({
                optionName: optionName,
                optionVotes: 0,
            });
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (optionsGiven_1_1 && !optionsGiven_1_1.done && (_a = optionsGiven_1.return)) _a.call(optionsGiven_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
    var voteInfo = {
        voterName: name,
        votedFor: name
    };
    var poll = {
        pollName: name,
        endTime: Date.now() + minutes * 60 * 1000,
        options: optionsGiven,
        voterName: name,
        totalVotes: 0,
        optionObj: optionObj,
        voteObj: [voteInfo]
    };
    pollMap.set(poll.pollName, poll);
    res.send({ poll: poll });
};
exports.addPoll = addPoll;
/**
 * Updates poll with votes
 * @oaram req the request
 * @param res the response
 */
var updatePoll = function (req, res) {
    var e_3, _a, e_4, _b;
    var voterName = req.body.voterName;
    if (typeof voterName !== "string") {
        res.status(400).send("missing 'name' parameter");
        return;
    }
    var pollName = req.body.pollName;
    if (typeof pollName !== "string") {
        res.status(400).send("missing or invalid name parameter");
        return;
    }
    var poll = pollMap.get(pollName);
    if (poll === undefined) {
        res.status(400).send("no auction with name ".concat(pollName));
        return;
    }
    var now = Date.now();
    if (now >= poll.endTime) {
        res.status(400).send("auction for \"".concat(pollName, "\" has already ended"));
        return;
    }
    var totalVotes = poll.totalVotes + 1;
    var chosenOption = req.body.chosenOption;
    if (typeof chosenOption !== "string") {
        res.status(400).send("missing or invalid name parameter");
        return;
    }
    var optionUpdate = [];
    var info = [];
    var hasVotedBefore = false;
    try {
        for (var _c = __values(poll.optionObj), _d = _c.next(); !_d.done; _d = _c.next()) {
            var option = _d.value;
            if (option.optionName === chosenOption) {
                optionUpdate.push({
                    optionName: chosenOption,
                    optionVotes: option.optionVotes + 1,
                });
            }
            else {
                var foundVote = false;
                try {
                    for (var _e = (e_4 = void 0, __values(poll.voteObj)), _f = _e.next(); !_f.done; _f = _e.next()) {
                        var vote = _f.value;
                        if (vote.voterName === voterName && vote.votedFor === option.optionName) {
                            optionUpdate.push({
                                optionName: option.optionName,
                                optionVotes: option.optionVotes - 1,
                            });
                            totalVotes = totalVotes - 1;
                            foundVote = true;
                        }
                    }
                }
                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                finally {
                    try {
                        if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                    }
                    finally { if (e_4) throw e_4.error; }
                }
                if (!foundVote) {
                    optionUpdate.push(option);
                }
            }
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
        }
        finally { if (e_3) throw e_3.error; }
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
exports.updatePoll = updatePoll;
/**
 * Loads the current state of the poll
 * @param req the request
 * @param req the response
 */
var getPoll = function (req, res) {
    var name = req.body.name;
    if (typeof name !== "string") {
        res.status(400).send("missing or invalid 'name' parameter");
        return;
    }
    var poll = pollMap.get(name);
    if (poll === undefined) {
        res.status(400).send("no poll with the name '".concat(name, "'"));
        return;
    }
    res.send({ poll: poll });
};
exports.getPoll = getPoll;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3JvdXRlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQTRCQSx3Q0FBd0M7QUFDeEMsSUFBTSxPQUFPLEdBQXNCLElBQUksR0FBRyxFQUFFLENBQUM7QUFFN0Msd0RBQXdEO0FBQ2pELElBQU0sZ0JBQWdCLEdBQUc7SUFDOUIsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2xCLENBQUMsQ0FBQztBQUZXLFFBQUEsZ0JBQWdCLG9CQUUzQjtBQUVGLFlBQVk7QUFDWixJQUFNLFlBQVksR0FBRyxVQUFDLENBQU8sRUFBRSxDQUFPO0lBQ3BDLElBQU0sR0FBRyxHQUFXLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUMvQixJQUFNLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUM7SUFDN0QsSUFBTSxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDO0lBQzdELE9BQU8sSUFBSSxHQUFHLElBQUksQ0FBQztBQUNyQixDQUFDLENBQUM7QUFFRiwrRUFBK0U7QUFDeEUsSUFBTSxxQkFBcUIsR0FBRyxVQUFDLEVBQVU7OztRQUM5QyxLQUFtQixJQUFBLEtBQUEsU0FBQSxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUEsZ0JBQUEsNEJBQUU7WUFBaEMsSUFBTSxJQUFJLFdBQUE7WUFDYixJQUFJLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQztTQUNwQjs7Ozs7Ozs7O0FBQ0gsQ0FBQyxDQUFDO0FBSlcsUUFBQSxxQkFBcUIseUJBSWhDO0FBRUY7Ozs7R0FJRztBQUNJ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