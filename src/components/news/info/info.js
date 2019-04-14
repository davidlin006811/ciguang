import React, { Component } from "react";
import qs from "qs";
import "./info.css";
class Info extends Component {
  constructor(props) {
    super(props);
    let qsString = qs.parse(props.location.search.slice(1));
    this.toolbar =
      typeof qsString.toolbar !== "undefined" ? qsString.toolbar : "1";
    this.url = qsString.url;
  }

  render() {
    let titleArea = null;
    if (this.props.toolbar !== "0") {
      titleArea = (
        <div
          className="banner detail-banner clearfix"
          style={{ backgroundColor: "#b6885d" }}
        >
          <div className="return-btn">
            <button
              onClick={() => {
                this.props.history.goBack();
              }}
            >
              <i className="iconfont" style={{ fontSize: "20px" }}>
                &#xe66f;
              </i>
            </button>
          </div>
          <div className="detail-title">資訊</div>
        </div>
      );
    }
    return (
      <div className="info-component">
        {titleArea}
        <iframe
          src={this.url}
          frameBorder="0"
          scrolling="no"
          id="iFrame1"
          title="資訊"
        />
      </div>
    );
  }
}
export default Info;
