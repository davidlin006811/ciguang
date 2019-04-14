import React, { Component } from "react";
import { Link } from "react-router-dom";
import { PullToRefresh } from "react-js-pull-to-refresh";
import InfiniteScroll from "react-infinite-scroller";
import { compareDate } from "../../commonFunctions";
import loadingImg from "../../image/loading.gif";
import noResultImg from "../../image/result_bg.png";
import "../../latest-info/latest-info.css";
import "../../component.css";
import "../../latest-info/latest-info.css";
import "./searchList.css";

class SearchResultList extends Component {
  constructor(props) {
    super(props);
    let date = new Date();
    let compDate = compareDate(date);
    this.state = {
      api: this.props.api,
      count: this.props.count,
      list: [],
      loadFinish: false,
      lastUpdateTime: date,
      lastCompareUpdateTime: compDate,
      update: this.props.update,
      pages: 1,
      currentPage: 1,
      noMore: false,
      dataReady: false
    };
    this.mounted = false;
  }
  refresh = () => {
    this.setState({
      loadFinish: false
    });
    return new Promise((resolve, reject) => {
      fetch(this.props.api)
        .then(result => {
          return result.json();
        })
        .then(data => {
          if (data.code === 1) {
            console.log(data);

            if (data.data.model === "radio") {
              data.data.rows.forEach(x => {
                x.url = x.url.replace(new RegExp("tvradio", "g"), "tv/radio");
              });
            }
            data.data.rows.forEach(x => {
              x.url = x.url.replace(
                new RegExp("https://h5.ciguang.tv/", "g"),
                "/"
              );
            });
            let updateTime = new Date();
            let lastCompareUpdateTime = compareDate(this.state.lastUpdateTime);
            let noMore = data.data.pages >= data.data.curr_page ? false : true;
            if (this.mounted) {
              this.setState({
                model: data.data.model,
                list: data.data.rows,
                loadFinish: true,
                lastUpdateTime: updateTime,
                lastCompareUpdateTime: lastCompareUpdateTime,
                pages: data.data.pages,
                currentPage: data.data.curr_page,
                totalRecords: data.data.total_records,
                dataReady: true,
                noMore: noMore
              });
              resolve(true);
            }
          } else {
            reject(false);
          }
        });
    });
  };
  fetchMore = () => {
    if (this.state.currentPage >= this.state.pages) {
      this.setState({
        noMore: true
      });
      return;
    }
    let pageNo = this.state.currentPage + 1;
    let api = this.props.api + "&page=" + pageNo;
    fetch(api)
      .then(result => {
        return result.json();
      })
      .then(data => {
        if (data.data.model === "radio") {
          data.data.rows.forEach(x => {
            x.url = x.url.replace(new RegExp("tvradio", "g"), "tv/radio");
          });
        }
        data.data.rows.forEach(x => {
          x.url = x.url.replace(new RegExp("https://h5.ciguang.tv/", "g"), "/");
        });
        let noMore = data.data.curr_page >= data.data.pages ? true : false;
        if (this.mounted) {
          this.setState({
            list: this.state.list.concat(data.data.rows),
            currentPage: data.data.curr_page,
            noMore: noMore
          });
        }
      });
  };
  componentDidMount() {
    this.mounted = true;
    this.refresh();
  }
  componentWillUnmount() {
    this.mounted = false;
  }
  componentWillReceiveProps(nextProps) {
    if (
      nextProps.api !== this.state.api &&
      nextProps.count !== this.state.count
    ) {
      this.setState({
        api: nextProps.api,
        count: nextProps.count
      });
      this.refresh();
    }
  }
  render() {
    let updateTime, pullPress, pullRelease, freshArea, endMessage;
    endMessage =
      this.state.noMore === true &&
      this.state.dataReady === true &&
      this.state.totalRecords > 0 ? (
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
          paddingTop: "10px",
          textAlign: "center",
          fontSize: "14px"
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
          paddingTop: "10px",
          textAlign: "center",
          fontSize: "14px"
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
            paddingTop: "10px",
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
    let noResult;
    if (this.state.dataReady && this.state.totalRecords === 0) {
      noResult = (
        <div className="no-search-result">
          <img src={noResultImg} alt="no-result" />
          <p>沒有搜索到您想要的內容哦</p>
        </div>
      );
    }
    return (
      <PullToRefresh
        onRefresh={this.refresh}
        pullDownThreshold={70}
        triggerHeight={50}
        pullDownContent={pullPress}
        releaseContent={pullRelease}
      >
        <div className="search-list-display" key={this.props.id}>
          {freshArea}

          <div className="latest-info-list  news-list-component search-list-component">
            <InfiniteScroll
              pageStart={0}
              loadMore={this.fetchMore}
              hasMore={!this.state.noMore}
              loader={loadingScreen}
              useWindow={false}
            >
              <p className="search-result-count">
                共有{this.state.totalRecords}条搜索结果
              </p>
              <ul>
                {this.state.list.map((item, index) => {
                  return (
                    <li className="latest-info-item" key={index}>
                      <Link to={item.url}>
                        <img src={item.cover} alt={item.title} />
                        <div className="item-desc">
                          <div className="item-title">
                            <p
                              className="line-clamp-1"
                              style={{
                                WebkitBoxOrient: "vertical",
                                fontSize: "14px"
                              }}
                            >
                              {item.title}
                            </p>
                            <p
                              className="line-clamp-3"
                              style={{
                                WebkitBoxOrient: "vertical",
                                fontSize: "12px",
                                color: "gray"
                              }}
                            >
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </InfiniteScroll>
            {endMessage}
            {noResult}
          </div>
        </div>
      </PullToRefresh>
    );
  }
}
export default SearchResultList;
