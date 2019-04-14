import React, { PureComponent } from "react";
import { Link } from "react-router-dom";
import { PullToRefresh } from "react-js-pull-to-refresh";
import "../../component.css";
import loadingImg from "../../image/loading.gif";
import InfiniteScroll from "react-infinite-scroller";
import { compareDate } from "../../commonFunctions";
import { PreTxt } from "../../commonConst";
import moreImg from "../../image/more.svg";
import hideImg from "../../image/hideMore.svg";
import "./radioList.css";

class RadioList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      list: [],
      showMore: [],
      loadFinish: true,
      lastUpdateTime: "",
      lastCompareUpdateTime: "",
      update: this.props.update,
      noMore: false
    };
    this.mounted = false;
    //console.log(this.props.url);
  }
  refresh = () => {
    // console.log("video list refresh");
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
            // console.log(data);
            let showMore = [];
            data.data.rows.forEach(x => {
              x.url = x.url.replace(new RegExp(PreTxt, "g"), "/");
            });
            for (let i = 0; i < data.data.rows.length; i++) {
              showMore.push(false);
            }

            let updateTime = new Date();
            let lastCompareUpdateTime = compareDate(this.state.lastUpdateTime);
            let noMore =
              this.state.pages === data.data.curr_page ? true : false;
            if (this.mounted) {
              this.setState({
                list: data.data.rows,
                loadFinish: true,
                lastUpdateTime: updateTime,
                lastCompareUpdateTime: lastCompareUpdateTime,
                showMore: showMore,
                pages: data.data.pages,
                currentPage: data.data.curr_page,
                noMore: noMore
              });
              /* 更新localstorage*/
              let updateList = {
                list: data.data.rows
              };
              localStorage.setItem(
                "radioList-" + this.props.id,
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
  fetchMore = () => {
    if (this.state.currentPage === this.state.pages) {
      this.setState({
        noMore: true
      });
      return;
    }
    let pageNo = this.state.currentPage + 1;
    let url = this.props.url + "&page=" + pageNo;
    fetch(url, { method: "get" })
      .then(result => {
        return result.json();
      })
      .then(data => {
        if (data.code === 1) {
          let showMore = [];
          data.data.rows.forEach(x => {
            x.url = x.url.replace(new RegExp(PreTxt, "g"), "/");
          });
          for (let i = 0; i < data.data.rows.length; i++) {
            showMore.push(false);
          }
          let noMore = this.state.pages === data.data.curr_page ? true : false;
          if (this.mounted) {
            let list = [...this.state.list, ...data.data.rows];
            this.setState({
              list: list,
              showMore: this.state.showMore.concat(showMore),
              currentPage: data.data.curr_page,
              noMore: noMore
            });
            /* 更新localstorage*/
            let updateList = {
              list: list
            };
            localStorage.setItem(
              "radioList-" + this.props.id,
              JSON.stringify(updateList)
            );
          }
        }
      });
  };
  showMoreDetail = index => {
    let showMore = this.state.showMore;
    showMore[index] = true;
    this.setState({
      showMore: showMore
    });
  };
  hideMore = index => {
    // console.log("hide more");
    let showMore = this.state.showMore;
    showMore[index] = false;
    this.setState({
      showMore: showMore
    });
  };
  componentWillMount() {
    let radioList = localStorage.getItem("radioList-" + this.props.id);
    //  console.log("video list", videoList);
    if (radioList != null) {
      radioList = JSON.parse(radioList);
      let showMore = [];
      for (let i = 0; i < radioList.length; i++) {
        showMore.push(false);
      }
      this.setState({
        list: radioList.list,
        showMore: showMore
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
    // console.log(this.state);
    let updateTime, pullPress, pullRelease, freshArea, endMessage;

    endMessage =
      this.state.noMore === true ? (
        <p
          style={{
            fontSize: "14px",
            fontWeight: "bold",
            textAlign: "center",
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
            marginTop: "-40%",
            paddingLeft: "32%",
            paddingBottom: "20px",
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
        pullDownThreshold={150}
        triggerHeight={50}
        pullDownContent={pullPress}
        releaseContent={pullRelease}
      >
        <div className="radios-list">
          {freshArea}

          <div className="radio-list-component">
            <InfiniteScroll
              pageStart={0}
              loadMore={this.fetchMore}
              hasMore={!this.state.noMore}
              loader={loadingScreen}
              useWindow={false}
            >
              {this.state.list.map((item, index) => {
                let desc;
                let descIcon;
                if (this.state.showMore[index] === true) {
                  desc = <div className="radio-desc-more">{item.desc}</div>;

                  descIcon = (
                    <div className="radio-underline">
                      <div className="left-underline" />
                      <div
                        className="underline-btn"
                        onClick={() => {
                          this.hideMore(index);
                        }}
                      >
                        <img src={hideImg} alt="less" />
                      </div>
                      <div className="right-underline" />
                    </div>
                  );
                } else {
                  desc = (
                    <div id="radioDesc" className="radio-item-desc">
                      {item.desc_s}
                    </div>
                  );
                  descIcon =
                    item.desc.length > item.desc_s.length ? (
                      <div className="radio-underline">
                        <div className="left-underline" />
                        <div
                          className="underline-btn"
                          onClick={() => {
                            this.showMoreDetail(index);
                          }}
                        >
                          <img src={moreImg} alt="more" />
                        </div>
                        <div className="right-underline" />
                      </div>
                    ) : (
                      <div className="break-line" />
                    );
                }
                return (
                  <div className="radio-list-item" key={index}>
                    <Link to={item.url}>
                      <h6>{item.title}</h6>
                    </Link>
                    <p className="radio-item-date">{item.date}</p>
                    <Link to={item.url}>
                      <img src={item.pre_picture} alt="电台图片" />
                    </Link>
                    {desc}
                    {descIcon}

                    <Link to={item.url} className="radio-btn">
                      打開專輯
                    </Link>
                  </div>
                );
              })}
            </InfiniteScroll>
            {endMessage}
          </div>
        </div>
      </PullToRefresh>
    );
  }
}
export default RadioList;
