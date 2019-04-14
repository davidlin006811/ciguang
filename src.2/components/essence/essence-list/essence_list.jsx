import React, { Component } from "react";
import { Link } from "react-router-dom";
//import InfiniteScroll from "react-infinite-scroll-component";
import { PullToRefresh } from "react-js-pull-to-refresh";
import InfiniteScroll from "react-infinite-scroller";
import Share from "../../share/share";
import { compareDate } from "../../commonFunctions";
import { PreTxt, SharePreTxt } from "../../commonConst";
import loadingImg from "../../image/loading.gif";
import favNImg from "../../image/favorite-n.svg";
import favImg from "../../image/favorite.svg";
import shareImg from "../../image/share.svg";
import "./essence_list.css";
import "../../component.css";

class EssenceList extends Component {
  constructor(props) {
    super(props);
    let date = new Date();
    let compDate = compareDate(date);
    this.state = {
      api: this.props.api,
      sort: this.props.sort,
      list: [],
      comment: {},
      count: 1, //user comment
      currentPage: 0,
      totlePages: 0,
      hasMore: true,
      refresh: false,
      lastUpdateTime: date,
      lastUpdateCompareTime: compDate,
      showShare: false,
      dataReady: false
    };
    this.mounted = false;
  }

  /* select love icon color */
  setFavItem = id => {
    let favListFromStorage = localStorage.getItem("essence-fav-list");
    let favList =
      favListFromStorage !== null ? JSON.parse(favListFromStorage) : [];

    let foundIndex = this.state.list.findIndex(x => {
      return x.id === id;
    });
    if (foundIndex >= 0) {
      let foundItem = this.state.list[foundIndex];
      let currentDate = new Date();
      let standardMode = false;
      let date = compareDate(currentDate, standardMode);
      let newItem = {
        id: foundItem.id,
        title: foundItem.title,
        picture: foundItem.cover,
        url: foundItem.share_url,
        date: date
      };
      favList.push(newItem);
    }
    localStorage.setItem("essence-fav-list", JSON.stringify(favList));
  };
  removeFavItem = id => {
    let favListFromStorage = localStorage.getItem("essence-fav-list");
    if (favListFromStorage !== null) {
      let favList = JSON.parse(favListFromStorage);
      let foundIndex = favList.findIndex(x => {
        return x.id === id;
      });
      if (foundIndex >= 0) {
        favList.splice(foundIndex, 1);
      }
      localStorage.setItem("essence-fav-list", JSON.stringify(favList));
    }
  };
  selectClass = id => {
    let oldComments;
    oldComments = this.state.comment;
    oldComments[id] = oldComments[id] === "blue" ? "red" : "blue";
    this.setState(state => ({
      comment: { ...oldComments }
    }));
    let data = JSON.stringify(this.state.comment);
    localStorage.setItem("EssenceComments", data);
    if (oldComments[id] === "red") {
      this.setFavItem(id);
    } else {
      this.removeFavItem(id);
    }
  };
  sortList = () => {
    this.state.list.sort(function(a, b) {
      let aTime = new Date(a.input_time).getTime();
      let bTime = new Date(b.input_time).getTime()();
      if (aTime > bTime) {
        return 1;
      } else {
        return -1;
      }
    });
  };
  fetchMoreData = () => {
    let api = this.state.api.substring(0, this.state.api.length - 1);
    let pageNo = this.state.currentPage + 1;

    api = api + pageNo;
    // console.log("api: ", api);
    fetch(api, {
      method: "get"
    })
      .then(result => {
        return result.json();
      })
      .then(data => {
        // console.log(data);
        let oldComments = this.state.comment;
        data.data.rows.forEach(x => {
          x.share_url = x.share_url.replace(new RegExp(PreTxt, "g"), "/");
          let id = x.id;

          if (oldComments[id] == null) {
            oldComments[id] = "blue";
          }
        });
        let hasMore = data.data.curr_page === data.data.pages ? false : true;
        if (this.mounted) {
          this.setState({
            list: this.state.list.concat(data.data.rows),
            currentPage: data.data.curr_page,
            totlePages: data.data.pages,
            comment: oldComments,
            hasMore: hasMore
          });
          if (this.state.sort !== "no_sort") {
            this.sortList();
          }
        }
      });
  };

  refresh = () => {
    this.setState({
      refresh: true
    });
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest();
      xhr.open("GET", this.state.api, true);
      xhr.onload = function(e) {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            let json_obj = JSON.parse(xhr.responseText);
            //console.log(json_obj);
            let oldComments = this.state.comment;
            json_obj.data.rows.forEach(x => {
              x.share_url = x.share_url.replace(new RegExp(PreTxt, "g"), "/");
              let id = x.id;

              if (oldComments[id] == null) {
                oldComments[id] = "blue";
              }

              /*  this.setState({
                comment: oldComments
              });*/
            });
            let freshTime = new Date();
            let compareUpdateTime = compareDate(this.state.lastUpdateTime);
            let hasMore =
              json_obj.data.curr_page === json_obj.data.pages ? false : true;
            if (this.mounted) {
              this.setState({
                list: json_obj.data.rows,
                currentPage: json_obj.data.curr_page,
                totlePages: json_obj.data.pages,
                refresh: false,
                comment: oldComments,
                lastUpdateTime: freshTime,
                lastUpdateCompareTime: compareUpdateTime,
                hasMore: hasMore,
                dataReady: true
              });

              let data = JSON.stringify(this.state.comment);
              localStorage.setItem("EssenceComments", data);

              if (this.state.sort !== "no_sort") {
                this.sortList();
              }
            }
            resolve(true);
          } else {
            console.error(xhr.statusText);
            reject(false);
          }
        }
      }.bind(this);
      xhr.onerror = function(e) {
        console.error(xhr.statusText);
        reject(false);
      };
      xhr.send(null);
    });
  };

  showShare = item => {
    this.setState({
      showShare: true,
      shareItem: item
    });
  };
  hideShare = () => {
    this.setState({
      showShare: false,
      shareItem: null
    });
  };
  componentDidMount() {
    this.mounted = true;
    let data = localStorage.getItem("EssenceComments");
    if (data != null) {
      let comment = JSON.parse(data);
      this.setState({
        comment: comment
      });
    }
    this.refresh();
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.api !== this.state.api) {
      this.setState({
        api: nextProps.api,
        list: []
      });
      setTimeout(() => {
        this.refresh();
      }, 200);
    }
  }
  componentWillUnmount() {
    this.mounted = false;
  }
  render() {
    let updateTime, pullPress, pullRelease, freshArea, endMessage;
    endMessage =
      this.state.hasMore === false && this.state.dataReady === true ? (
        <p
          style={{
            fontSize: "14px",
            fontWeight: "bold",
            textAlign: "center",
            paddingTop: "20px",
            paddingBottom: "20px"
          }}
        >
          <i
            className="fas fa-long-arrow-alt-up"
            style={{ paddingRight: "10px" }}
          />
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
        <i
          className="fas fa-long-arrow-alt-down"
          style={{ paddingRight: "10px" }}
        />
        下拉可以更新
        <p
          style={{
            paddingTop: "5px",
            paddingBottom: "10px",
            textAlign: "center"
          }}
        >
          最後更新：
          {this.state.lastUpdateCompareTime}
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
        <i
          className="fas fa-long-arrow-alt-up"
          style={{ paddingRight: "10px" }}
        />
        松開立即刷新
        <p
          style={{
            paddingTop: "5px",
            paddingBottom: "10px",
            textAlign: "center"
          }}
        >
          最後更新：
          {this.state.lastUpdateCompareTime}
        </p>
      </div>
    );

    if (!this.state.refresh) {
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
    let loadingScreen = this.state.dataReady ? (
      <div
        key={this.props.api}
        style={{ textAlign: "center", paddingBottom: "10px" }}
      >
        <img src={loadingImg} style={{ width: "24px" }} alt="loading" />
        <span>正在載入更多數據 ...</span>
      </div>
    ) : null;

    //设置分享界面
    let shareComponent;
    if (this.state.showShare) {
      let url = SharePreTxt + this.state.shareItem.share_url + "&toolbar=0";

      shareComponent = (
        <div className="share-component">
          <Share
            url={url}
            title={this.state.shareItem.title}
            image={this.state.shareItem.cover}
            description={this.state.shareItem.description}
            hideShare={this.hideShare}
          />
        </div>
      );
    }
    let listClass =
      this.props.toolbar === "0"
        ? "articles-list low-padding"
        : "articles-list";
    let dataList = this.state.list.map((item, index) => {
      let fav = this.state.comment[item.id] === "blue" ? favNImg : favImg;
      return (
        <li key={index}>
          <Link to={item.share_url}>
            <h5>{item.title}</h5>
          </Link>
          <div className="date">
            <span>{item.input_time}</span>
            <span>{item.cate_name}</span>
          </div>
          <div className="cover">
            <Link to={item.share_url}>
              <img src={item.cover} alt={item.title} />
            </Link>
          </div>
          <p className="desc">{item.description}</p>
          <div className="foot clearfix">
            <div className="view">
              <Link to={item.share_url}>閱讀全文</Link>
            </div>
            <div className="social">
              <img
                src={fav}
                alt="social"
                onClick={() => this.selectClass(item.id)}
              />

              <div className="share">
                <img
                  src={shareImg}
                  alt="share"
                  onClick={() => {
                    this.showShare(item);
                  }}
                />
              </div>
            </div>
          </div>
        </li>
      );
    });
    let elementList = (
      <div className="news-list">
        {freshArea}
        <div className="news-list-component">
          <InfiniteScroll
            pageStart={0}
            loadMore={this.fetchMoreData}
            hasMore={this.state.hasMore}
            loader={loadingScreen}
            useWindow={false}
          >
            <ul>{dataList}</ul>
          </InfiniteScroll>
          {endMessage}
        </div>
      </div>
    );
    return (
      <div id="articleList" className={listClass}>
        <PullToRefresh
          onRefresh={this.refresh}
          pullDownThreshold={70}
          triggerHeight={50}
          pullDownContent={pullPress}
          releaseContent={pullRelease}
        >
          {elementList}
        </PullToRefresh>
        {shareComponent}
      </div>
    );
  }
}

export default EssenceList;
