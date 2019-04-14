import React, { PureComponent } from "react";
import { Link } from "react-router-dom";
import Swiper from "react-id-swiper";
import qs from "qs";
import { PullToRefresh } from "react-js-pull-to-refresh";
import { PreTxt, SharePreTxt } from "../../commonConst";
import { compareDate } from "../../commonFunctions";
import "../../component.css";
import "../specials.css";
import "./catSpecial.css";
import "../../silder/slideShow.css";
import loadingImg from "../../image/loading.gif";
import bgImg from "../../image/video_poster.jpg";
import shareImg from "../../image/share.svg";
import favoriteNImg from "../../image/favorite-n.svg";
import favoriteImg from "../../image/favorite.svg";
import playImg from "../../image/play.svg";
import Share from "../../share/share";

class CatSpecial extends PureComponent {
  constructor(props) {
    super(props);
    // console.log(props);
    let toolbar = "1";
    let api;
    let showAD = true;
    if (props.match.path === "/cat/special/:id") {
      let qsString = qs.parse(props.location.search.slice(1));

      if (qsString.toolbar !== null) {
        toolbar = qsString.toolbar;
      }
      api =
        PreTxt +
        "special/" +
        this.props.match.params.id +
        "?client=" +
        qsString.client +
        "&v=" +
        qsString.v +
        "&special_id=" +
        qsString.special_id;
      if (qsString.hint !== null && qsString.hint === "0") {
        showAD = false;
      }
    }
    let date = new Date();
    let compDate = compareDate(date);

    this.state = {
      cat: "专题",
      focusList: [],
      list: [],
      api: api,
      toolbar: toolbar,
      lastUpdateTime: date,
      lastCompareUpdateTime: compDate,
      loadFinish: true,
      showAD: showAD
    };
    this.mounted = false;
  }
  goBack = () => {
    this.props.history.goBack();
  };
  /* select love icon color */
  setComment = id => {
    let oldComments;
    oldComments = this.state.comments;
    oldComments[id] = !oldComments[id];
    this.setState(state => ({
      comments: { ...oldComments }
    }));
    let data = JSON.stringify(this.state.comments);
    localStorage.setItem("specialArticle-comments", data);
  };
  refresh = () => {
    this.setState({
      loadFinish: false
    });
    return new Promise((resolve, reject) => {
      fetch(this.state.api, { method: "get" })
        .then(result => {
          return result.json();
        })
        .then(data => {
          //console.log(data);
          if (data.code === 1) {
            let oldComments = {};
            if (this.state.comments !== undefined) {
              oldComments = this.state.comments;
            }
            data.data.focus_list.forEach(x => {
              x.url = x.url.replace(new RegExp(PreTxt, "g"), "/");
              if (!this.state.showAD) {
                x.url += "&hint=0";
              }
            });
            data.data.rows.forEach(x => {
              x.url = x.url.replace(new RegExp(PreTxt, "g"), "/");
              if (!this.state.showAD) {
                x.url += "&hint=0";
              }
              if (x.type === "live" && x.live_status === null) {
                x.live_status = "直播中";
              }
            });
            let focusList = [];
            if (data.data.rows.length > 0) {
              for (let i = 0; i < data.data.focus_list.length; i++) {
                let foundIndex = data.data.rows.findIndex(x => {
                  return x.id === data.data.focus_list[i].id;
                });
                if (foundIndex >= 0) {
                  focusList.push(data.data.rows[foundIndex]);
                }
              }
            } else {
              focusList = data.data.focus_list;
            }

            for (let i = 0; i < data.data.rows.length; i++) {
              let x = data.data.rows[i];
              if (x.type === "article") {
                let id = x.id;
                if (oldComments[id] === undefined) {
                  oldComments[id] = false;
                }
              }
            }
            let updateTime = new Date();
            let lastCompareUpdateTime = compareDate(this.state.lastUpdateTime);
            if (this.mounted) {
              this.setState({
                id: data.data.id,
                focusList: focusList,
                list: data.data.rows,
                title: data.data.title,
                lastUpdateTime: updateTime,
                lastCompareUpdateTime: lastCompareUpdateTime,
                loadFinish: true,
                comments: oldComments
              });
              document.title = data.data.title;
            }

            resolve(true);
          } else {
            reject(false);
          }
        });
    });
  };
  checkImgValid = () => {
    for (let i = 0; i < this.state.list.length; i++) {
      let imgId = "cover" + i;
      let img = document.getElementById(imgId);
      if (img !== null) {
        img.onerror = () => {
          img.src = bgImg;
        };
      }
    }
    /*for (let i = 0; i < this.state.focusList.length; i++) {
      let id = this.state.focusList[i].id;
      let imgId = "focusCover" + id;
      let focusId = "#focus" + id;
      let focus = document.getElementById(focusId);

      let img = document.getElementById(imgId);
      if (img !== null) {
        img.onerror = () => {
          //img.src = bgImg;
           focus.style.backgroundImage = "url(" + bgImg + ")";
          //console.log("focus: ", focus);
         
        };
      }
    } */
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
    let comments;
    let storeComments = localStorage.getItem("specialArticle-comments");
    if (storeComments !== null) {
      comments = JSON.parse(storeComments);
      this.setState({
        comments: comments
      });
    }

    this.refresh();
  }
  componentDidUpdate() {
    this.checkImgValid();
  }
  componentWillUnmount() {
    this.mounted = false;
  }
  render() {
    //console.log(this.state);
    const params = {
      direction: "horizontal",
      pagination: {
        el: ".swiper-pagination",
        type: "bullets",

        clickable: true
      },
      autoplay: {
        delay: 8000,
        disableOnInteraction: false
      },
      loop: true,
      slidesPerView: "auto",
      effect: "slide",
      shouldSwiperUpdate: true
    };
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
            <div className="return-btn" onClick={this.goBack}>
              <i className="iconfont" style={{ fontSize: "20px" }}>
                &#xe66f;
              </i>
            </div>
            <span>{this.state.title}</span>
          </div>
        </div>
      );
    }

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
    let focus;
    let height = ((window.innerWidth - 20) * 9) / 16 + 20;
    if (this.state.focusList.length > 0) {
      let list = this.state.focusList.map(item => {
        let status =
          typeof item.live_status !== "undefined" ? item.live_status : "直播中";
        return (
          <div key={item.id} style={{ width: "100%" }} className="slide-item">
            <Link to={item.url} className="special-focus-item">
              <div style={{ backgroundImage: "url(" + item.cover + ")" }}>
                <div className="special-live-icon">
                  <div className="wave-icon">
                    <span />
                    <span />
                    <span />
                    <span />
                    <div className="special-focus-live-txt">{status}</div>
                  </div>
                </div>
                <div className="cat-special-play-icon">
                  <img src={playImg} alt="play" />
                </div>
              </div>
              <p style={{ color: "white" }}>{item.title}</p>
            </Link>
          </div>
        );
      });
      focus = (
        <div className="special-focus">
          <Swiper {...params}>{list}</Swiper>
        </div>
      );
    }

    let list;
    if (this.state.list.length > 0) {
      list = this.state.list.map((item, index) => {
        let id = item.id;
        let imgId = "cover" + index;

        let foundIndex = this.state.focusList.findIndex(x => {
          return x.id === id;
        });
        if (foundIndex < 0) {
          if (item.type === "article") {
            let favImg = this.state.comments[item.id]
              ? favoriteImg
              : favoriteNImg;
            return (
              <div className="cat-special-list-item" key={item.id}>
                <Link to={item.url}>
                  <p className="cat-special-item-title">{item.title}</p>
                  <p className="cat-list-item-updatetime">{item.update_time}</p>
                </Link>
                <Link to={item.url}>
                  <img id={imgId} src={item.cover} alt="cover" />
                </Link>
                <div className="cat-special-bottom">
                  <Link to={item.url}>閱讀全文</Link>
                  <div className="special-share">
                    <img
                      src={shareImg}
                      alt="share"
                      onClick={() => {
                        this.showShare(item);
                      }}
                    />
                    <img
                      src={favImg}
                      alt="favorite"
                      onClick={() => {
                        this.setComment(item.id);
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          } else if (item.type === "video") {
            return (
              <div className="cat-special-list-item" key={item.id}>
                <Link to={item.url}>
                  <p className="cat-special-item-videoTitle">{item.title}</p>
                  <p className="cat-list-item-updatetime">{item.update_time}</p>
                  <div
                    className="special-video-item"
                    style={{ height: height }}
                  >
                    <img id={imgId} src={item.cover} alt="cover" />
                    <div className="cat-special-play-icon">
                      <img src={playImg} alt="play" />
                    </div>
                  </div>
                </Link>
              </div>
            );
          } else {
            return (
              <div className="cat-special-list-item" key={item.id}>
                <Link to={item.url}>
                  <p className="cat-special-item-videoTitle">{item.title}</p>
                  <p className="cat-list-item-updatetime">{item.update_time}</p>
                  <div
                    className="special-video-item"
                    style={{ height: height }}
                  >
                    <img id={imgId} src={item.cover} alt="cover" />
                    <div className="cat-special-live-icon">
                      <div className="wave-icon">
                        <span />
                        <span />
                        <span />
                        <span />
                        <div className="special-item-live-txt">
                          {item.live_status}
                        </div>
                      </div>
                    </div>
                    <div className="cat-special-play-icon">
                      <img src={playImg} alt="play" />
                    </div>
                  </div>
                </Link>
              </div>
            );
          }
        } else {
          return null;
        }
      });
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
            description={this.state.shareItem.description}
            hideShare={this.hideShare}
          />
        </div>
      );
    }
    let marginTop = this.state.toolbar !== "0" ? "50px" : 0;
    return (
      <div className="special-component">
        {titleArea}
        <div className="special-body" style={{ marginTop: marginTop }}>
          <PullToRefresh
            onRefresh={this.refresh}
            pullDownThreshold={200}
            triggerHeight={50}
            pullDownContent={pullPress}
            releaseContent={pullRelease}
          >
            {freshArea}
            {focus}
            {list}
          </PullToRefresh>
        </div>
        {shareComponent}
      </div>
    );
  }
}
export default CatSpecial;
