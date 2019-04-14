import React, { PureComponent } from "react";
import { Link } from "react-router-dom";
import "../../component.css";
import loadingImg from "../../image/loading.gif";
import { PullToRefresh } from "react-js-pull-to-refresh";
import { compareDate } from "../../commonFunctions";
import { PreTxt } from "../../commonConst";

class VideoList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      list: [],
      focus: {},
      loadFinish: true,
      lastUpdateTime: "",
      lastCompareUpdateTime: "",
      update: this.props.update
    };
    this.mounted = false;
  }
  refresh = () => {
    this.setState({
      loadFinish: false
    });
    return new Promise((resolve, reject) => {
      fetch(this.props.url, { method: "get" })
        .then(result => {
          return result.json();
        })
        .then(data => {
          if (data.code === 1) {
            data.data.rows.forEach(x => {
              x.url = x.url.replace(new RegExp(PreTxt, "g"), "/");
            });
            let focus = data.data.rows.shift();
            let updateTime = new Date();
            let lastCompareUpdateTime = compareDate(this.state.lastUpdateTime);
            if (this.mounted) {
              this.setState({
                list: data.data.rows,
                focus: focus,
                loadFinish: true,
                lastUpdateTime: updateTime,
                lastCompareUpdateTime: lastCompareUpdateTime
              });
              /* 更新localstorage*/
              let updateList = {
                list: data.data.rows,
                focus: focus
              };
              localStorage.setItem(
                "videoList-" + this.props.id,
                JSON.stringify(updateList)
              );
            }

            resolve(true);
          } else {
            reject(false);
          }
        });
    });
  };

  componentWillMount() {
    let videoList = localStorage.getItem("videoList-" + this.props.id);
    //  console.log("video list", videoList);
    if (videoList != null) {
      videoList = JSON.parse(videoList);
      this.setState({
        list: videoList.list,
        focus: videoList.focus
      });
    }
  }
  componentDidMount() {
    this.mounted = true;
    let date = new Date();
    let compDate = compareDate(date);
    this.setState({
      lastUpdateTime: date,
      lastCompareUpdateTime: compDate
    });

    if (this.props.update || this.state.list.length === 0) {
      this.refresh();
    }
  }

  render() {
    //  console.log("video list rending...");
    let updateTime, pullPress, pullRelease, freshArea;

    pullPress = (
      <div
        style={{
          textAlign: "center",
          fontSize: "14px",
          backgroundColor: "#f2f3f8"
        }}
      >
        <i className="iconfont" style={{ paddingRight: "10px" }}>
          &#xe62e;
        </i>
        下拉可以更新
        <p
          style={{
            paddingTop: "5px",
            paddingBottom: "10px",
            textAlign: "center"
          }}
        >
          最後更新：
          {this.state.lastCompareUpdateTime}
        </p>
      </div>
    );
    pullRelease = (
      <div
        style={{
          textAlign: "center",
          fontSize: "14px",
          backgroundColor: "#f2f3f8"
        }}
      >
        <i className="iconfont" style={{ paddingRight: "10px" }}>
          &#xe749;
        </i>
        松開立即刷新
        <p
          style={{
            paddingTop: "5px",
            paddingBottom: "10px",
            textAlign: "center"
          }}
        >
          最後更新：
          {this.state.lastCompareUpdateTime}
        </p>
      </div>
    );

    if (this.state.loadFinish) {
      freshArea = null;
    } else {
      freshArea = (
        <div
          style={{
            width: "100%",
            marginTop: "-40%",
            paddingBottom: "20px",
            paddingLeft: "32%",
            fontSize: "14px",
            backgroundColor: "#f2f3f8"
          }}
        >
          <img src={loadingImg} alt="正在刷新數據" style={{ width: "30px" }} />
          <span style={{ fontWeight: "bold" }}>正在刷新數據</span>
          {updateTime}
        </div>
      );
    }
    //console.log(this.props);
    let focusUrl =
      typeof this.state.focus.url !== "undefined" ? this.state.focus.url : "#";
    return (
      <PullToRefresh
        onRefresh={this.refresh}
        pullDownThreshold={200}
        triggerHeight={50}
        pullDownContent={pullPress}
        releaseContent={pullRelease}
      >
        {freshArea}
        <div>
          <div id={this.state.focus.id} className="video-list-component">
            <Link className="focus-video" to={focusUrl}>
              <img src={this.state.focus.pre_picture} alt="focus" />
              <p className="video-title">{this.state.focus.title}</p>
              <p className="videos-update">
                更新至 {this.state.focus.total} 集
              </p>
            </Link>

            {this.state.list.map((item, index) => {
              let itemClassName =
                index % 2 === 0 ? "video-item left" : "video-item right";

              return (
                <Link className={itemClassName} key={item.id} to={item.url}>
                  <img src={item.pre_picture} alt="video-item" />
                  <p className="video-title">{item.title}</p>
                  <p className="videos-update">
                    更新至
                    {item.total} 集
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </PullToRefresh>
    );
  }
}
export default VideoList;
