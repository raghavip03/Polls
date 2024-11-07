import React, { Component, ChangeEvent, MouseEvent} from "react";
import { Poll, parsePoll } from "./poll";
import { isRecord } from "./record";

type DetailsProps = {
  name: string
  onBackClick: () => void,
};

type DetailsState = {
  now: number,
  poll: Poll | undefined,
  voterName: string,
  chosenOption: string,
  error: string,
  voted: boolean
  voteMsg: string,
};

export class PollDetails extends Component<DetailsProps, DetailsState> {
  constructor(props: DetailsProps) {
    super(props);
    this.state = {now: Date.now(), poll: undefined, voterName: "", chosenOption: "",  error: "", voted: false, voteMsg: ""};
  }
  componentDidMount = (): void => {
    this.doRefreshClick();
  };

  render = (): JSX.Element => {
    if(this.state.poll === undefined) {
      return <p>Loading poll..."{this.props.name}</p>
    } else {
      if(this.state.poll.endTime <= this.state.now) {
      return this.renderCompleted(this.state.poll);
      } else {
        return this.renderOngoing(this.state.poll);
      }
    };
  }

  renderCompleted = (poll: Poll): JSX.Element => {
    if (this.state.poll !== undefined) {
      const min = Math.round((this.state.poll.endTime - this.state.now) / (60 * 1000));
      const total = poll.totalVotes;
      const results: JSX.Element[] = [];
      for (const option of poll.optionObj) {
        const percentage = total > 0 ? (option.optionVotes / total) * 100 : 0;
        results.push(
          <li key={option.optionName}>
            {`${percentage}%`} - {option.optionName}
          </li>
        );
      }
      return (
        <div>
          <h2>{poll.pollName}</h2>
          <p>Closed {min} mins ago</p>
          <ul>{results}</ul>
          <button type="button" onClick={this.doBackClick}>
            Back
          </button>
          <button type="button" onClick={this.doRefreshClick}>
            Refresh
          </button>
        </div>
      );
    }
    return <div>No poll data available</div>;
  };


  renderOngoing = (poll: Poll): JSX.Element => {
    if(this.state.poll !== undefined) {
    const min = Math.round((poll.endTime - this.state.now) / 60 / 100) / 10;
    const optionShow: JSX.Element[] = [];
    for(const option of poll.options) {
      optionShow.push(
        <ul key={option}>
          <div>
            <input
              type="radio"
              name={`${poll.pollName}-radioGroup`}
              value={option}
              checked={this.state.chosenOption === option}
              onChange={this.doOptionNameChange}
              disabled={this.state.voted}
            />
            <label htmlFor={`${poll.pollName}-${option}`}>{option}</label>
          </div>
        </ul> );
         if (this.state.voted) {
          const voteMsg = `Recorded vote of "${this.state.voterName}" for "${this.state.chosenOption}"`;
          this.setState({ voteMsg: voteMsg });
         }
    }
    return (
      <div>
        <h2>{poll.pollName}</h2>
        <p>Closes in {min} minutes...</p>
        <div>{optionShow}</div>
        <div>
          <label htmlFor="voterName">Voter Name</label>
          <input type="text" id="voter" value={this.state.voterName}
          onChange={this.doVoterChange}></input>
        </div>
        <button type="button" onClick={this.doVoteClick}>Vote</button>
        <button type="button" onClick={this.doRefreshClick}>Refresh</button>
        <button type="button" onClick={this.doBackClick}>Back</button>
        {this.renderError()}
        <p>{this.state.voteMsg}</p>
      </div>
    )
  } else {
    return <div>Loading Poll..</div>
  }
  };
  renderError = (): JSX.Element => {
    if(this.state.error.length === 0) {
      return <div></div>;
    } else {
      const style = {width: '300px', backgroundColor: 'rgb(246,194,192)',
      border: '1px solid rgb(137,66,61)', borderRadius: '5px', padding: '5px' };
  return (<div style={{marginTop: '15px'}}>
      <span style={style}><b>Error</b>: {this.state.error}</span>
    </div>);
}
};

//doRefreshClick
doRefreshClick = (): void => {
  const args = new URLSearchParams({ name: this.props.name }).toString();
  fetch(`/api/get?${args}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  })
    .then(this.doGetResp)
    .catch(() => this.doGetError("failed to connect to server"));
};

//doGetResp
doGetResp = (res: Response): void => {
  if(res.status === 200) {
    res.json().then(this.doGetJson)
    .catch(() => this.doGetError("200 res is not JSON"));
  } else if(res.status === 400) {
    res.text().then(this.doGetError)
    .catch(() => this.doGetError("400 reponse is not text"));
  } else {
    this.doGetError(`bad status code from /api/refresh: ${res.status}`);
  }
};
doGetJson = (data: unknown): void => {
  if(!isRecord(data)) {
    console.error("bad data from /api/refresh: not a record", data);
    return;
  }
  this.doPollChange(data);
}

doPollChange = (data: {poll?: unknown}): void => {
  const poll = parsePoll(data.poll);
  if(poll !== undefined) {
    this.setState({poll, now: Date.now(), error: ""});
  } else {
    console.error("poll from /api/refresh did not parse", data.poll);
  }
};

doGetError = (msg: string): void => {
  console.error(`Error fetching /api/refresh: ${msg}`);
};

doVoterChange = (evt: ChangeEvent<HTMLInputElement>): void => {
  this.setState({voterName: evt.target.value, error: ""});
};

doOptionNameChange = (evt: ChangeEvent<HTMLInputElement>): void => {
  this.setState({chosenOption: evt.target.value, error: ""});
}

doVoteClick = (_: MouseEvent<HTMLButtonElement>): void => {
  if(this.state.poll === undefined) {
    throw new Error("impossible");
  }

  if (this.state.voterName.trim().length === 0 ||
        this.state.chosenOption.trim().length === 0) {
      this.setState({error: "a required field is missing."});
      return;
    }


  const args = {pollName: this.props.name, voterName: this.state.voterName,
  chosenOption: this.state.chosenOption}
  fetch("api/update", {
    method: "POST", body: JSON.stringify(args),
    headers: {"Content-Type": "application/json"}})
    .then(this.doUpdateResp)
    .catch(() => this.doUpdateError("failed to connect to server"));
}

//doUpdateResp
doUpdateResp = (res: Response): void => {
  if (res.status === 200) {
    res.json().then(this.doUpdateJson)
        .catch(() => this.doUpdateError("200 response is not JSON"));
  } else if (res.status === 400) {
    res.text().then(this.doUpdateError)
        .catch(() => this.doUpdateError("400 response is not text"));
  } else {
    this.doUpdateError(`bad status code from /api/bid: ${res.status}`);
  }
};

doUpdateJson = (data: unknown): void => {
  if (this.state.poll === undefined)
    throw new Error("impossible");

  if (!isRecord(data)) {
    console.error("bad data from /api/bid: not a record", data);
    return;
  }

  this.doPollUpdateChange(data);
};

doPollUpdateChange = (data: {poll?: unknown}): void => {
  const poll = parsePoll(data.poll);
  if(poll !== undefined) {
    this.setState({poll, now: Date.now(), error: "", voted: true});
   console.log(poll)
  } else {
    console.error("poll from /api/refresh did not parse", data.poll);
  }
};

//doUpdateError
doUpdateError = (msg: string): void => {
  console.error(`Error fetching /api/update: ${msg}`);
};

doBackClick = (_: MouseEvent<HTMLButtonElement>): void => {
  this.props.onBackClick();
};
}




