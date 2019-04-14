import React, { Component } from "react";
import { Link } from "react-router-dom";
import qs from "qs";
import "../component.css";
import loadingImg from "../image/loading.gif";
import moreImg from "../image/more.svg";
import hideImg from "../image/hideMore.svg";
import bgImg from "../image/video_poster.jpg";
import shareImg from "../image/share.svg";
import { PullToRefresh } from "react-js-pull-to-refresh";
import { compareDate } from "../commonFunctions";
import { SpecialAPI, PreTxt, SharePreTxt } from "../commonConst";
import "./specials.css";
import "../silder/slideShow.css";
import Share from "../share/share";

class Specials extends Component {
  constructor(props) {
    super(props);
    //console.log(this.props);
    let date = new Date();
    let compDate = compareDate(date);
    let toolbar = 0;
    if (props.match.path === "/special/:id") {
      let qsString = qs.parse(props.location.search.slice(1));
      if (qsString.toolbar !== null) {
        toolbar = qsString.toolbar;
      }
    }
    this.state = {
      list: [],
      showMore: [],
      loadFinish: true,
      lastUpdateTime: date,
      lastCompareUpdateTime: compDate,
      noMore: false,
      toolbar: toolbar,
      showShare: false
    };
    this.mounted = false;
  }
  fresh = () => {
    this.setState({
      loadFinish: false
    });
    return new Promise((resolve, reject) => {
      fetch(SpecialAPI, { method: "get" })
        .then(result => {
          return result.json();
        })
        .then(data => {
          // console.log(data);
          if (data.code === 1) {
            let updateTime = new Date();
            let lastCompareUpdateTime = compareDate(this.state.lastUpdateTime);
            let showMore = [];
            for (let i = 0; i < data.data.rows.length; i++) {
              let url = data.data.rows[i].url;
              data.data.rows[i].url = url.replace(
                new RegExp(PreTxt, "g"),
                "/cat/"
              );

              showMore.push(false);
            }
            let noMore =
              this.state.pages === data.data.curr_page ? true : false;
            if (this.mounted) {
              this.setState({
                list: data.data.rows,
                loadFinish: true,
                showMore: showMore,
                lastUpdateTime: updateTime,
                lastCompareUpdateTime: lastCompareUpdateTime,
                pages: data.data.pages,
                currentPage: data.data.curr_page,
                noMore: noMore
              });
            }
            resolve(true);
          } else {
            reject(false);
          }
        });
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
  checkImgValid = () => {
    for (let i = 0; i < this.state.list.length; i++) {
      let imgId = "cover" + i;
      let img = document.getElementById(imgId);
      img.onerror = () => {
        img.src = bgImg;
      };
    }
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
    document.title = "专题";
    this.fresh();
  }
  componentDidUpdate() {
    this.checkImgValid();
  }
  componentWillUnmount() {
    this.mounted = false;
  }
  render() {
    //console.log(this.state);
    let updateTime, pullPress, pullRelease, freshArea;

    pullPress = (
      <div
        style={{
          textAlign: "center",
          fontSize: "14px",
          paddingTop: "10px",
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
          paddingTop: "10px",
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
            marginTop: "-50%",
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
    let list = (
      <div className="special-list">
        {this.state.list.map((item, index) => {
          let imgId = "cover" + index;
          let desc;
          let descIcon;
          if (this.state.showMore[index] === true) {
            desc = <div className="special-desc-more">{item.description}</div>;

            descIcon = (
              <div className="special-underline">
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
              <div id="specialDesc" className="special-item-desc">
                {item.desc_s}
              </div>
            );

            descIcon =
              item.description.length > item.desc_s.length ? (
                <div className="special-underline">
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
                <div className="spec-break-line" />
              );
          }
          return (
            <div className="special-list-item" key={index}>
              <div className="special-item">
                <Link to={item.url}>
                  <h5>{item.title}</h5>
                  <p className="special-update-time">{item.update_time}</p>
                  <img id={imgId} src={item.cover} alt="pic-item" />
                </Link>
                {desc}
                {descIcon}
              </div>

              <div className="special-bottom">
                <Link to={item.url}>进入专题</Link>
                <div className="special-share">
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
          );
        })}
      </div>
    );

    let titleArea = null;
    if (this.state.toolbar !== "0") {
      titleArea = (
        <div
          className="banner clearfix"
          style={{
            height: "40px",
            backgroundColor: "#FF6692"
          }}
        >
          <div className="special-banner-title">
            <div className="return-btn">
              <Link to="/">
                <i className="iconfont" style={{ fontSize: "20px" }}>
                  &#xe66f;
                </i>
              </Link>
            </div>
            <h5>专题</h5>
          </div>
        </div>
      );
    }
    //设置分享界面
    let shareComponent;
    if (this.state.showShare) {
      let url = SharePreTxt + this.state.shareItem.url + "&toolbar=0";

      shareComponent = (
        <div className="share-component">
          <Share
            url={url}
            title={this.state.shareItem.title}
            image={this.state.shareItem.cover}
            description={this.state.shareItem.desc_s}
            hideShare={this.hideShare}
          />
        </div>
      );
    }
    return (
      <div className="special-component">
        {titleArea}
        <div className="special-body">
          <PullToRefresh
            onRefresh={this.fresh}
            pullDownThreshold={200}
            triggerHeight={50}
            pullDownContent={pullPress}
            releaseContent={pullRelease}
          >
            {freshArea}
            {list}
          </PullToRefresh>
        </div>
        {shareComponent}
      </div>
    );
  }
}

export default Specials;
