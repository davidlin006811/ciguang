import React, { Component } from "react";
import { Link } from "react-router-dom";
import { PullToRefresh } from "react-js-pull-to-refresh";
import InfiniteScroll from "react-infinite-scroller";
import { PreTxt } from "../../commonConst";
import { compareDate } from "../../commonFunctions";
import loadingImg from "../../image/loading.gif";
import "../../latest-info/latest-info.css";
import "../../component.css";
import "./newsList.css";

class LatestInfo extends Component {
  constructor(props) {
    super(props);
    // console.log(this.props);
    let date = new Date();
    let compDate = compareDate(date);
    let api = this.props.api.replace(new RegExp("/cat", "g"), PreTxt);

    this.state = {
      api: api,
      list: [],
      loadFinish: false,
      lastUpdateTime: date,
      lastCompareUpdateTime: compDate,
      update: this.props.update,
      pages: 1,
      currentPage: 1,
      noMore: false,
      dataReady: false
      // notAvailable: true
    };
    this.mounted = false;
  }
  refresh = () => {
    // console.log("video list refresh");
    this.setState({
      loadFinish: false
    });
    return new Promise((resolve, reject) => {
      fetch(this.state.api, { method: "get" })
        .then(result => {
          return result.json();
        })
        .then(data => {
          //console.log(this.state.api);
          // console.log(data);
          if (data.code === 1) {
            if (
              this.props.model === "video" ||
              this.props.model === "radio" ||
              this.props.model === "article" ||
              this.props.model === "essence"
            ) {
              data.data.rows.forEach(x => {
                x.url = x.url.replace(new RegExp(PreTxt, "g"), "/");
              });
            } else if (this.props.model === "info") {
              data.data.rows.forEach(x => {
                x.url = "/info/detail?url=" + x.url;
              });
            } else if (this.props.model === "live") {
              data.data.rows.forEach(x => {
                x.url = "/cat/live/info?itemid=" + x.item_id;
              });
            }

            let updateTime = new Date();
            let lastCompareUpdateTime = compareDate(this.state.lastUpdateTime);
            let noMore = data.data.pages === data.data.curr_page ? true : false;
            if (this.mounted) {
              this.setState({
                list: data.data.rows,
                loadFinish: true,
                lastUpdateTime: updateTime,
                lastCompareUpdateTime: lastCompareUpdateTime,
                pages: data.data.pages,
                currentPage: data.data.curr_page,
                noMore: noMore,
                dataReady: true
                // notAvailable: false
              });
            }

            resolve(true);
          } else {
            reject(false);
          }
        });
    });
  };
  fetchMore = () => {
    //console.log("fetch more");
    if (this.state.currentPage >= this.state.pages) {
      this.setState({
        noMore: true
      });
      return;
    }
    /*  if (this.state.notAvailable) {
      return;
    }*/
    let pageNo = this.state.currentPage + 1;
    let api = this.state.api + "&page=" + pageNo;
    /* this.setState({
      notAvailable: true
    });*/
    //console.log("fetch more api: ", api);
    fetch(api)
      .then(result => {
        return result.json();
      })
      .then(data => {
        if (data.code === 1) {
          if (
            this.props.model === "video" ||
            this.props.model === "radio" ||
            this.props.model === "article" ||
            this.props.model === "essence"
          ) {
            data.data.rows.forEach(x => {
              x.url = x.url.replace(new RegExp(PreTxt, "g"), "/");
            });
          } else if (this.props.model === "info") {
            data.data.rows.forEach(x => {
              x.url = "/info/detail?url=" + x.url;
            });
          } else if (this.props.model === "live") {
            data.data.rows.forEach(x => {
              x.url = "/cat/live/info?itemid=" + x.item_id;
            });
          }
          let noMore = this.state.pages === data.data.curr_page ? true : false;
          if (this.mounted) {
            this.setState({
              list: this.state.list.concat(data.data.rows),
              currentPage: data.data.curr_page,
              noMore: noMore
              // notAvailable: false
            });
          }

          /* 更新localstorage*/
          let updateList = {
            list: this.state.list.concat(data.data.rows)
          };
          localStorage.setItem(
            "newsList-" + this.props.id,
            JSON.stringify(updateList)
          );
        }
      });
  };

  componentDidMount() {
    this.mounted = true;
    if (this.props.update || this.state.list.length === 0) {
      this.refresh();
    }
  }
  componentWillUnmount() {
    this.mounted = false;
  }

  render() {
    //console.log(this.state);
    let updateTime, pullPress, pullRelease, freshArea, endMessage;
    endMessage =
      this.state.noMore === true && this.state.dataReady === true ? (
        <p
          style={{
            fontSize: "14px",
            fontWeight: "bold",
            textAlign: "center",
            paddingTop: "20px",
            paddingBottom: "20px"
          }}
        >
          <i className="iconfont" style={{ paddingRight: "10px" }}>
            &#xe749;
          </i>
          已經全部加載完畢
        </p>
      ) : null;
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
    let loadingScreen = (
      <div key={this.props.id} style={{ textAlign: "center" }}>
        <img src={loadingImg} style={{ width: "24px" }} alt="loading" />
        <span>正在載入更多數據 ...</span>
      </div>
    );
    return (
      <PullToRefresh
        onRefresh={this.refresh}
        pullDownThreshold={70}
        triggerHeight={50}
        pullDownContent={pullPress}
        releaseContent={pullRelease}
      >
        <div id="newsList" className="news-list" key={this.props.id}>
          {freshArea}

          <div className="news-list-component">
            <InfiniteScroll
              pageStart={0}
              loadMore={this.fetchMore}
              hasMore={!this.state.noMore}
              loader={loadingScreen}
              useWindow={false}
            >
              <ul>
                {this.state.list.map((item, index) => {
                  //item.url = item.url.replace(new RegExp(PreTxt, "g"), "/");
                  //item.url += "&item_id=" + item.item_id;
                  let pic =
                    item.cover !== undefined ? item.cover : item.pre_picture;
                  return (
                    <li className="latest-info-item" key={index}>
                      <Link to={item.url}>
                        <img src={pic} alt={item.title} />
                        <div className="item-desc">
                          <div className="item-title">
                            <p
                              className="line-clamp-2"
                              style={{ WebkitBoxOrient: "vertical" }}
                            >
                              {item.title}
                            </p>
                          </div>
                          <div className="item-bottom">
                            <div className={"latest-info-" + this.props.model}>
                              {this.props.tabTitle}
                            </div>
                            <div className="info-date">{item.date}</div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </InfiniteScroll>
            {endMessage}
          </div>
        </div>
      </PullToRefresh>
    );
  }
}
export default LatestInfo;
