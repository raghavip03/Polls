import React, { Component, MouseEvent } from "react";
import { parsePoll, Poll } from "./poll";
import { isRecord } from "./record";

type ListProps = {
  onNewClick: () => void,
  onPollClick: (name: string) => void
};

type ListState = {
  now: number,
  polls: Poll[] | undefined,
};

//renders the list of options and "new" button to create a new poll
export class PollList extends Component<ListProps, ListState> {
  constructor(props: ListProps) {
    super(props);
    this.state = {now: Date.now(), polls: undefined};
  }

  componentDidMount = (): void => {
      this.doRefreshClick();
  }

  componentDidUpdate = (prevProps: ListProps): void => {
    if(prevProps !==  this.props) {
      this.setState({now: Date.now()});
    }
  };

  render = (): JSX.Element => {
    return (
      <div>
        <h2>Current Polls</h2>
        <h3>Still Open</h3>
        {this.renderPolls(true)}
        <h3>Closed</h3>
        {this.renderPolls(false)}
        <button type="button" onClick={this.doRefreshClick}>Refresh</button>
        <button type="button" onClick={this.doNewClick}>New Poll</button>
      </div>
    );
  };
  renderPolls = (open: boolean): JSX.Element => {
    if (this.state.polls === undefined) {
      return <p>Loading open polls...</p>;
    } else {
      const polls: JSX.Element[] = [];
      for (const poll of this.state.polls) {
        const min = (poll.endTime - Date.now()) / (60 * 1000);
        const desc =
        min > 0 && open ? (
          <span> - {Math.round(min)} minutes remaining</span>
        ) : min <= 0 && !open ? (
          <span> - Closed {Math.round(-min)} minutes ago</span>
        ) : (
          <span></span>
        );
       // const desc = open ? <span> - {Math.round(min)} minutes remaining</span> : <span> - closed {Math.round(min)} minutes ago</span>;
       if ((min > 0 && open) || (min <= 0 && !open)) {
        polls.push(
          <li key={poll.pollName}>
            <a href="#" onClick={(evt) => this.doPollClick(evt, poll.pollName)}>{poll.pollName}</a>
            {desc}
          </li>
        );
       }
        }
      return <ul>{polls}</ul>;
    }
  };

//doListResp
doListResp = (resp: Response): void => {
  if(resp.status === 200) {
    resp.json().then(this.doListJson)
      .catch(() => this.doListError("200 response is not JSON"));
  } else if (resp.status === 400) {
    resp.text().then(this.doListError)
    .catch(() => this.doListError("400 response is not text"));
  } else {
    this.doListError(`bad status code from /api/list: ${resp.status}`);
  }
};
//doListJson
doListJson = (data: unknown): void => {
  if(!isRecord(data)) {
    console.error("bad data from /api/list: not a record", data);
    return;
  }
  if(!Array.isArray(data.polls)) {
    console.error("bad data from /api/list: polls is not an array", data);
    return;
  }
  const polls: Poll[] = [];
  for(const val of data.polls) {
    const poll = parsePoll(val);
    if(poll === undefined)
    return;
  polls.push(poll);
  }
  this.setState({polls, now: Date.now()});
}

doRefreshClick = (): void => {
  fetch("api/list").then(this.doListResp)
  .catch(() => this.doListError("failed to connect to server"));
}

//doListError
doListError = (msg: string): void => {
  console.error(`Error fetching /api/list: ${msg}`);
};

doNewClick = (_evt: MouseEvent<HTMLButtonElement>): void => {
  this.props.onNewClick();
};

doPollClick = (evt: MouseEvent<HTMLAnchorElement>, name: string): void => {
  evt.preventDefault();
  this.props.onPollClick(name);
}
}