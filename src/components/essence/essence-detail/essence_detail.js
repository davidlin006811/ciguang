import React, { PureComponent } from "react";
import withRouter from "react-router-dom/es/withRouter";
//import { isMobile } from "react-device-detect";
import qs from "qs";
import { PreTxt } from "../../commonConst";
import { removeUrlAmp } from "../../commonFunctions";
import AD from "../../ad/ad";
import "./essence_detail.css";
import errorImg from "../../image/sorry.jpg";
import loadingImg from "../../image/loading.gif";

class EssenceDetail extends PureComponent {
  constructor(props) {
    super(props);
    // console.log(props);
    this.state = {
      selectedArticle: {}, // the selected article content
      toolbar: "1",
      fontSize: "middle-font", //the font-size of article content
      smallBtn: "no-active-btn",
      middleBtn: "active-btn",
      largeBtn: "no-active-btn",
      loading: true
    };
    //console.log(this.props);
  }

  componentWillMount() {
    //console.log(this.props.history);
    let queryString = qs.parse(
      removeUrlAmp(this.props.location.search).slice(1)
    );
    if (typeof queryString.toolbar !== "undefined") {
      let showAD = true;
      if (
        queryString.toolbar === "0" &&
        typeof queryString.hint !== "undefined" &&
        queryString.hint === "0"
      ) {
        showAD = false;
      }
      this.setState({
        toolbar: queryString.toolbar,
        showAD: showAD
      });
    }

    //console.log(queryString);
    let api;
    if (this.props.match.path === "/essence/:id") {
      let version = typeof queryString.v === "undefined" ? 2 : queryString.v;
      api =
        PreTxt +
        "essence/detail" +
        "?client=web" +
        "&v=" +
        version +
        "&id=" +
        queryString.id +
        "&encoder=2";
    } else if (this.props.match.path === "/special/:id") {
      api =
        PreTxt +
        "special/" +
        this.props.match.params.id +
        "?client=" +
        queryString.client +
        "&v=" +
        queryString.v +
        "&id=" +
        queryString.id +
        "&special_id=" +
        queryString.special_id;
    } else if (this.props.match.path === "/news/:id") {
      api =
        PreTxt +
        "news/detail?" +
        "client=" +
        queryString.client +
        "&v=" +
        queryString.v +
        "&id=" +
        queryString.id;
    }

    var xhr = new XMLHttpRequest();

    xhr.open("GET", api, true);
    xhr.onload = function(e) {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          let json_obj = JSON.parse(xhr.responseText);

          if (json_obj.code === 1) {
            // console.log(json_obj);
            if (
              this.props.match.path === "/essence/:id" ||
              this.props.match.path === "/news/:id"
            ) {
              //精华图文
              json_obj.data.content = this.replaceAll(
                json_obj.data.content,
                "/uploads",
                "https://hk-qiniu.ciguang.tv/uploads"
              );

              this.setState({
                selectedArticle: json_obj.data,
                loading: false
              });
              document.title = json_obj.data.title;
            } else if (this.props.match.path === "/special/:id") {
              //专题图文
              json_obj.data.rows.content = this.replaceAll(
                json_obj.data.rows.content,
                "/uploads",
                "https://hk-qiniu.ciguang.tv/uploads"
              );
              this.setState({
                selectedArticle: json_obj.data.rows,
                loading: false
              });
              document.title = json_obj.data.rows.title;
            }
          }
        } else {
          console.error(xhr.statusText);
        }
      }
    }.bind(this);
    xhr.onerror = function(e) {
      console.error(xhr.statusText);
    };
    xhr.send(null);
  }
  replaceAll = (str, find, replace) => {
    return str.replace(new RegExp(find, "g"), replace);
  };

  changeFontSize = size => {
    this.setState({
      fontSize: size,
      smallBtn: "no-active-btn",
      middleBtn: "no-active-btn",
      largeBtn: "no-active-btn"
    });
    if (size === "large-font") {
      this.setState({
        largeBtn: "active-btn"
      });
    } else if (size === "middle-font") {
      this.setState({
        middleBtn: "active-btn"
      });
    } else if (size === "small-font") {
      this.setState({
        smallBtn: "active-btn"
      });
    }
  };
  createContentMarkup = content => {
    return { __html: content };
  };
  closeAd = () => {
    this.setState({
      showAD: false
    });
  };

  /* render digest div and detail article content div*/
  renderDivs() {
    let titleArea, loadingDisplay;
    if (this.state.toolbar !== "0") {
      let bannerColor =
        this.props.match.path === "/news/:id" ? "#b6885d" : "#00a9c7";
      titleArea = (
        <div
          className="banner detail-banner clearfix"
          style={{ backgroundColor: bannerColor }}
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
          <div className="detail-title">{this.state.selectedArticle.title}</div>
        </div>
      );
    } else {
      titleArea = <div />;
    }
    if (this.state.loading === true) {
      loadingDisplay = (
        <div style={{ paddingTop: "30%", paddingLeft: "25%" }}>
          <img src={loadingImg} alt=" 正在载入中" style={{ width: "30px" }} />
          <span
            style={{
              paddingLeft: "10px",
              fontSize: "14px",
              fontWeight: "bold"
            }}
          >
            正在載入中， 請稍等...
          </span>
        </div>
      );
    } else {
      loadingDisplay = (
        <div id="contentTop" className="content">
          <h5>{this.state.selectedArticle.title}</h5>
          <p className="author">{this.state.selectedArticle.author}</p>
          <div className="font-size-select clearfix">
            <span
              className={this.state.smallBtn}
              onClick={() => this.changeFontSize("small-font")}
              style={{ backgroundColor: this.state.smallBtn }}
            >
              小
            </span>

            <span
              className={this.state.middleBtn}
              onClick={() => this.changeFontSize("middle-font")}
              style={{ backgroundColor: this.state.middleBtn }}
            >
              中
            </span>
            <span
              className={this.state.largeBtn}
              onClick={() => this.changeFontSize("large-font")}
              style={{ backgroundColor: this.state.largeBtn }}
            >
              大
            </span>
          </div>
          <div
            className={this.state.fontSize}
            dangerouslySetInnerHTML={this.createContentMarkup(
              this.state.selectedArticle.content
            )}
          />
        </div>
      );
    }
    let ad;
    if (this.state.showAD) {
      ad = <AD closeAd={this.closeAd} bgColor="#00a9c7" color="#fff" />;
    }
    return (
      <React.Fragment>
        {titleArea}
        {ad}
        {loadingDisplay}
      </React.Fragment>
    );
  }

  renderContent() {
    return <React.Fragment>{this.renderDivs()}</React.Fragment>;
  }
  render() {
    return this.renderContent();
  }
}

export default withRouter(EssenceDetail);
