import React, {Component, ChangeEvent, MouseEvent} from "react";
import { isRecord } from "./record";

type NewPollProps = {
  onBackClick: () => void
}

type NewPollState = {
  pollName: string,
  minutes: string,
  options: string[],
  error: string
  voterName: string,
  chosen: string;
};

export class NewPoll extends Component<NewPollProps, NewPollState> {
  constructor(props: NewPollProps) {
    super(props);
    this.state = {pollName: "", minutes: "1", options: [], error: "", voterName: "", chosen: ""};
  }
  render = (): JSX.Element => {
    return (
      <div>
        <h2>New Poll</h2>
        <div>
          <label htmlFor="pollName">Name:</label>
          <input id="name" type="text" value={(this.state.pollName)}
          onChange={this.doNameChange}></input>
        </div>
        <div>
          <label htmlFor="minutes">Minutes:</label>
          <input id="minutes" type="number" min="1" value={(this.state.minutes)}
          onChange={this.doMinutesChange}></input>
        </div>
        <div>
          <label htmlFor="textbox">Options (comma seperated list, minimum 2 options):</label>
          <br/>
          <textarea id="textbox" rows={3} value={this.state.options}
          onChange={this.doOptionsChange}></textarea>
        </div>
        <button type="button" onClick={this.doStartClick}>Create</button>
        <button type="button" onClick={this.doBackClick}>Back</button>
        {this.renderError()}
      </div>);
  };
  renderError = (): JSX.Element => {
    if (this.state.error.length === 0) {
      return <div></div>;
    } else {
      const style = {width: '300px', backgroundColor: 'rgb(246,194,192)',
          border: '1px solid rgb(137,66,61)', borderRadius: '5px', padding: '5px' };
      return (<div style={{marginTop: '15px'}}>
          <span style={style}><b>Error</b>: {this.state.error}</span>
        </div>);
  }
}
doNameChange = (evt: ChangeEvent<HTMLInputElement>): void => {
  this.setState({pollName: evt.target.value, error: ""});
}

doMinutesChange = (evt: ChangeEvent<HTMLInputElement>): void => {
  this.setState({minutes: evt.target.value, error: ""});
};

doOptionsChange = (evt: ChangeEvent<HTMLTextAreaElement>): void => {
  const options = evt.target.value;
  const optionsArr = options.split(",");
  this.setState({options: optionsArr, error: ""});
};

doStartClick = (_: MouseEvent<HTMLButtonElement>): void => {
  if(this.state.pollName.trim().length === 0 ||
    this.state.minutes.trim().length === 0 ||
    this.state.options.length === 0) {
      this.setState({error: "a require field is missing!"});
      return;
    }
    const minutes = parseFloat(this.state.minutes);
    if(isNaN(minutes) || minutes < 1 || Math.floor(minutes) !== minutes) {
      this.setState({error: "minutes is not a positive integer"});
      return;
    }
   const args = {name: this.state.pollName, minutes: minutes, options: this.state.options};
   fetch("/api/add", {
    method: "POST", body: JSON.stringify(args), headers: {"Content-Type": "application/json"}})
    .then(this.doAddResp)
    .catch(() => this.doAddError("failed to connect to server"));
}

//doAddResp
doAddResp = (resp: Response): void => {
  if(resp.status === 200) {
    resp.json().then(this.doAddJson)
    .catch(() => this.doAddError("200 response is not JSON"));
  } else if (resp.status === 400) {
    resp.text().then(this.doAddError)
    .catch(() => this.doAddError("400 response is not text"));
  } else {
    this.doAddError(`bad status code from /api/add: ${resp.status}`);
  }
};

//doAddJson
doAddJson = (data: unknown): void => {
  if(!isRecord(data)) {
    console.error("bad data from /api/add: not a record", data);
    return;
  }
  this.props.onBackClick();
}
//doAddError
doAddError = (msg: string): void => {
  this.setState({error: msg});
}

doBackClick = (_: MouseEvent<HTMLButtonElement>): void => {
  this.props.onBackClick();
};
}