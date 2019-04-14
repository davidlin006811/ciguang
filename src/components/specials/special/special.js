import React, { PureComponent } from "react";
import qs from "qs";
import EssenceDetail from "../../essence/essence-detail/essence_detail";
import SpecialLive from "./specialLive/specialLive";
import SpecialVideo from "./specialVideo/specialVideo";
import { PreTxt } from "../../commonConst";
import { removeUrlAmp } from "../../commonFunctions";

class Special extends PureComponent {
  constructor(props) {
    super(props);
    // console.log(props);
    let qsString = qs.parse(removeUrlAmp(props.location.search).slice(1));
    let toolbar = "1";
    if (qsString.toolbar !== null) {
      toolbar = qsString.toolbar;
    }
    let type = props.match.params.id;
    let lastString;
    if (type !== "video") {
      lastString = "&special_id=" + qsString.special_id;
    } else {
      lastString = "&album_id=" + qsString.album_id;
    }
    let showAD = true;
    let hint = "1";
    if (qsString.hint !== null && qsString.hint === "0") {
      showAD = false;
      hint = "0";
    }
    let api =
      PreTxt +
      "special/" +
      this.props.match.params.id +
      "?client=" +
      qsString.client +
      "&v=" +
      qsString.v +
      "&id=" +
      qsString.id +
      lastString +
      "&hint=" +
      hint;
    let episodeId = qsString.episode_id !== null ? qsString.episode_id : "";
    let programId = qsString.program_id !== null ? qsString.program_id : "";
    this.state = {
      id: qsString.id,
      specialId: qsString.special_id,
      version: qsString.v,
      episodeId: episodeId,
      programId: programId,
      api: api,
      list: [],
      type: type,
      toolbar: toolbar,
      loadFinish: true,
      showAD: showAD
    };
  }
  goBack = () => {
    this.props.history.goBack();
  };
  render() {
    //console.log(this.state);
    let content;
    if (this.state.type === "article") {
      content = <EssenceDetail api={this.state.api} />;
    } else if (this.state.type === "live") {
      content = (
        <SpecialLive
          api={this.state.api}
          goBack={this.goBack}
          id={this.state.id}
          specialId={this.state.specialId}
          version={this.state.version}
          episodeId={this.state.episodeId}
          programId={this.state.programId}
          showAD={this.state.showAD}
        />
      );
    } else if (this.state.type === "video") {
      content = (
        <SpecialVideo
          api={this.state.api}
          goBack={this.goBack}
          id={this.state.id}
          specialId={this.state.specialId}
          version={this.state.version}
          showAD={this.state.showAD}
        />
      );
    }
    return <div>{content}</div>;
  }
}
export default Special;
