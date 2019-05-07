import React, { PureComponent } from "react";
import Swiper from "react-id-swiper";
import $ from "jquery";
import qs from "qs";
import AD from "../../ad/ad";
import Share from "../../share/share";
import VideoPlayer from "../../videoPlayer/videoPlayer";
import { PreTxt, SharePreTxt } from "../../commonConst";
import {
  isLandscape,
  compareDate,
  getMobileOperatingSystem
} from "../../commonFunctions";
import "../../component.css";
import "./video.css";

import VideoInfo from "./videoAction";

class Video extends PureComponent {
  constructor(props) {
    super(props);
    let showAd = true;
    let queryString = qs.parse(this.props.location.search.slice(1));
    if (typeof queryString.hint !== "undefined" && queryString.hint === "0") {
      showAd = false;
    }
    this.OS = getMobileOperatingSystem();
    // this.isWeChatBrowser = isWechat();
    this.state = {
      list: [], //视频列表
      title: "", //當前節目所屬的分類的名稱
      catId: "", // 當前節目所屬的分類id
      currentVideo: {}, //当前播放的视频
      currentVideoIndex: 0, //当前播放的视频索引
      totalCount: 0, // 总共多少记录
      pageSize: 0, // 每页显示多少
      pages: 0, // 壹共多少頁
      currentPage: 0, // 當前頁碼
      lastPlayTime: 0, //定义上次播放的时间
      favorite: false, //当前视频favorite
      isLandScape: isLandscape(),
      showShare: false,
      showAd: showAd,
      beginPlaying: false
    };
    //this.windowWidth = isLandscape() ? window.innerHeight : window.innerWidth;
    this.mounted = false;
    this.showMenuTimer = null;
  }
  goBack = currentTime => {
    if (currentTime !== null && currentTime !== 0) {
      if (currentTime > 1) {
        let data = {
          currentVideoId: this.state.currentVideo.id,
          lastPlayTime: currentTime
        };
        localStorage.setItem(
          "last-video-" + this.state.catId,
          JSON.stringify(data)
        );
      }
    }
    this.props.history.goBack();
  };

  //屏幕切换
  fullScreen = () => {
    if (this.state.showAd) {
      $("#adComponent").hide();
    }
    $("#currentVideoInfo1").hide();
  };
  normalScreen = () => {
    if (this.state.showAd) {
      $("#adComponent").show();
    }
    $("#currentVideoInfo1").show();
  };

  selectPage = index => {
    if (index === this.state.currentPage) {
      return;
    } else {
      this.setState({
        currentPage: index
      });
    }
  };
  //选择视频
  selectVideo = item => {
    if (this.state.currentVideo.id === item.id || !this.mounted) {
      return;
    } else {
      let index = this.state.list.findIndex(x => {
        return x.id === item.id;
      });

      //get favorite from loaclstorage
      let favorite = false;
      let fav = localStorage.getItem("video-fav-list");
      if (fav !== null) {
        let favorites = JSON.parse(fav);
        let index = favorites.findIndex(x => {
          return x.id === item.id && x.catId === this.state.catId;
        });
        if (index >= 0) {
          favorite = true;
        }
      }
      this.setState({
        currentVideo: item,
        currentVideoIndex: index,
        lastPlayTime: 0, //定义上次播放的时间
        favorite: favorite
      });
    }
  };

  //视频结束
  videoEnd = () => {
    let selectIndex = this.state.currentVideoIndex + 1;
    selectIndex = selectIndex === this.state.totalCount ? 0 : selectIndex;
    this.selectVideo(this.state.list[selectIndex]);
  };

  setFavorite = favorite => {
    this.setState({
      favorite: favorite
    });
    // console.log(this.state);
    let catId = this.state.catId;
    let id = this.state.currentVideo.id;
    let cat = localStorage.getItem("video-fav-list");
    let favList = cat === null ? [] : JSON.parse(cat);
    let index = favList.findIndex(x => {
      return x.id === id && x.catId === catId;
    });
    if (favorite === true) {
      if (index < 0) {
        let currentDate = new Date();
        let standardMode = false;
        let date = compareDate(currentDate, standardMode);
        let url =
          "/video/" +
          this.props.match.params.id +
          "?client=" +
          this.state.client +
          "&v=" +
          this.state.version +
          "&catid=" +
          this.state.catId +
          "&itemid=" +
          this.state.currentVideo.id;
        let favVideo = {
          id: id,
          catId: catId,
          title: this.state.currentVideo.title,
          picture: this.state.currentVideo.pre_picture,
          url: url,
          date: date
        };
        favList.push(favVideo);
      }
    } else {
      if (index >= 0) {
        favList.splice(index, 1);
      }
    }
    localStorage.setItem("video-fav-list", JSON.stringify(favList));
  };
  showShare = () => {
    this.setState({
      showShare: true
    });
  };
  hideShare = () => {
    this.setState({
      showShare: false
    });
  };
  closeAd = () => {
    this.setState({
      showAd: false
    });
  };
  componentDidMount() {
    this.mounted = true;
    let queryString = qs.parse(this.props.location.search.slice(1));

    let api =
      PreTxt +
      "video/" +
      this.props.match.params.id +
      "?client=" +
      queryString.client +
      "&v=" +
      queryString.v +
      "&catid=" +
      queryString.catid;
    // console.log(api);
    fetch(api, { method: "get" })
      .then(result => {
        return result.json();
      })
      .then(data => {
        //console.log(data);
        if (data.code === 1) {
          let catId = data.data.cat_id;
          let currentVideoId,
            currentVideoIndex = 0,
            currentPage =
              typeof queryString.page !== "undefined" && queryString.page !== ""
                ? parseInt(queryString.page, 10) - 1
                : 0,
            lastPlayTime = 0,
            currentVideo = { ...data.data.rows[0] };
          //查看url是否含有视频id，如果有，选取该id为当前视频id
          if (typeof queryString.itemid !== "undefined") {
            // console.log("item id:", queryString.item_id);
            let itemId = parseInt(queryString.itemid, 10);
            let index = data.data.rows.findIndex(x => {
              return x.id === itemId;
            });
            //  console.log("index: ", index);
            if (index >= 0) {
              currentVideoId = queryString.itemid;
              currentVideoIndex = index;
              currentVideo = { ...data.data.rows[index] };
            }
          } else {
            //如果url里不包含视频id，查看上次退出前正在播放的视频记录
            let lastPlay = localStorage.getItem("last-video-" + catId);

            if (lastPlay !== null) {
              let lastPlayVideo = JSON.parse(lastPlay);
              //console.log("last play video: ", lastPlayVideo);
              currentVideoId = lastPlayVideo.currentVideoId;

              if (lastPlayVideo.lastPlayTime !== null) {
                lastPlayTime = parseInt(lastPlayVideo.lastPlayTime, 10);
              }
            }

            if (currentVideoId !== null) {
              let index = data.data.rows.findIndex(x => {
                return x.id === currentVideoId;
              });
              if (index >= 0) {
                currentVideo = { ...data.data.rows[index] };
                currentVideoIndex = index;

                currentPage = parseInt(index / 100, 10);
              }
            }
          }
          //get favorite
          let favorite = false;
          let favs = localStorage.getItem("video-fav-list");
          if (favs !== null) {
            let favorites = JSON.parse(favs);
            let index = favorites.findIndex(x => {
              return x.id === currentVideoId && x.catId === data.data.cat_id;
            });
            if (index >= 0) {
              favorite = true;
            }
          }

          if (this.mounted) {
            this.setState({
              list: data.data.rows,
              currentVideo: currentVideo,
              currentVideoIndex: currentVideoIndex,
              title: data.data.cat_title,
              catId: data.data.cat_id,
              totalCount: data.data.total_count,
              pageSize: data.data.pagesize,
              pages: data.data.pages,
              currentPage: currentPage,
              lastPlayTime: lastPlayTime,
              favorite: favorite,
              client: queryString.client,
              version: queryString.v
              //muted: muted
            });
            document.title = data.data.cat_title;
          }
        }
      });
  }

  componentWillUnmount() {
    this.mounted = false;
  }
  render() {
    // console.log(this.state);
    let currentPlayVideo;
    let videoTitle, videoCat, catInfo;

    if (this.state.currentVideo.mp4_url) {
      const info = {
        title: this.state.currentVideo.title,
        poster: this.state.currentVideo.pre_picture,
        url: this.state.currentVideo.mp4_url,
        selectedResolution: "",
        virtualMode: true,
        videoMode: true,
        lastPlayTime: this.state.lastPlayTime,
        repeat: false,
        videoEnd: this.videoEnd,
        goBack: this.goBack,
        fullScreen: this.fullScreen,
        normalScreen: this.normalScreen
      };
      currentPlayVideo = <VideoPlayer {...info} />;
    } else {
      currentPlayVideo = null;
    }

    //视频标题栏
    videoTitle = (
      <marquee
        behavior="scroll"
        direction="left"
        loop="infinite"
        scrollamount="2"
        scrolldelay="30"
        height="40px"
      >
        <span>{this.state.currentVideo.title}</span>
        <span style={{ paddingLeft: "85%" }}>
          {this.state.currentVideo.title}
        </span>
      </marquee>
    );
    videoCat = (
      <VideoInfo
        catId={this.state.catId}
        title={this.state.title}
        totalCount={this.state.totalCount}
        currentVideo={this.state.currentVideo}
        favorite={this.state.favorite}
        setFavorite={this.setFavorite}
        showShare={this.showShare}
      />
    );

    //视频列表栏

    //设置swiper参数
    const params = {
      direction: "horizontal",
      pagination: {
        el: ".swiper-pagination",
        type: "custom",
        clickable: true
      },
      freeMode: true,
      loop: false,
      slidesPerView: 5,
      effect: "slide",
      shouldSwiperUpdate: true
    };
    //设置索引栏
    let pages = [];
    for (let i = 0; i < this.state.pages; i++) {
      pages.push(i);
    }
    //  console.log("current page", this.state.currentPage);
    let activeList = [];
    catInfo = (
      <div className="video-cat-video-list">
        <div className="cat-list-wrapper">
          <Swiper {...params}>
            {pages.map((item, index) => {
              let from = item * 100 + 1;
              let end =
                from + 100 > this.state.totalCount
                  ? this.state.totalCount
                  : from + 100 - 1;
              let indexClass =
                index === this.state.currentPage
                  ? "video-index-active"
                  : "video-index";
              if (this.state.currentPage === index) {
                activeList = this.state.list.slice(from - 1, end);
                //console.log("active list: ", activeList);
              }

              return (
                <div
                  className={indexClass}
                  key={"videogroup" + index}
                  onClick={() => {
                    this.selectPage(index);
                  }}
                >
                  {from} ~ {end}
                </div>
              );
            })}
          </Swiper>
        </div>
        <div className="cat-video-detail">
          {activeList.map((item, index) => {
            let bgColor =
              this.state.currentVideo.id === item.id ? "#fd7d02" : "#f2f3f8";
            let txtColor =
              this.state.currentVideo.id === item.id ? "white" : "black";
            return (
              <div className="detail-video-list" key={item.id}>
                <button
                  style={{ backgroundColor: bgColor, color: txtColor }}
                  onClick={() => {
                    this.selectVideo(item);
                  }}
                >
                  {this.state.currentPage * 100 + index + 1}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );

    //设置分享界面
    let shareComponent;
    if (this.state.showShare) {
      let shareUrl =
        SharePreTxt +
        "/video/" +
        this.props.match.params.id +
        "?client=" +
        this.state.client +
        "&v=" +
        this.state.version +
        "&catid=" +
        this.state.catId +
        "&itemid=" +
        this.state.currentVideo.id +
        "&page=" +
        (this.state.currentPage + 1);

      shareComponent = (
        <div className="share-component">
          <Share
            url={shareUrl}
            title={this.state.currentVideo.share_title}
            image={this.state.currentVideo.share_image}
            description={this.state.currentVideo.share_desc}
            hideShare={this.hideShare}
          />
        </div>
      );
    }
    let ad;
    if (this.state.showAd && !this.state.isLandScape) {
      ad = <AD closeAd={this.closeAd} />;
    }
    return (
      <div id="videoWrapper" className="video-wrapper">
        {ad}

        {currentPlayVideo}
        <div id="currentVideoInfo1" className="moving-title">
          <div className="current-program-title"> {videoTitle}</div>

          {videoCat}
          {catInfo}
        </div>
        {shareComponent}
      </div>
    );
  }
}
export default Video;
