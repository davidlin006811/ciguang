import React, { PureComponent } from "react";
import Swiper from "react-id-swiper";
import $ from "jquery";
import qs from "qs";
import AD from "../../ad/ad";
import Share from "../../share/share";
import { PreTxt, SharePreTxt } from "../../commonConst";
import {
  numberToTime,
  isLandscape,
  compareDate,
  getMobileOperatingSystem,
  isWechat
} from "../../commonFunctions";
import "../../component.css";
import "./video.css";
import playImg from "../../image/play.svg";
import pauseImg from "../../image/pause.svg";
import fullScreenImg from "../../image/full_screen.svg";
import normalScreenImg from "../../image/normal_screen.svg";
import playProgressImg from "../../image/play_progress.svg";
import muteImg from "../../image/mute.svg";
import loadingImg from "../../image/loading.gif";
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
      playing: true, //定义视频是否处在播放状态
      currentVideo: {}, //当前播放的视频
      currentVideoIndex: 0, //当前播放的视频索引
      totalCount: 0, // 总共多少记录
      pageSize: 0, // 每页显示多少
      pages: 0, // 壹共多少頁
      currentPage: 0, // 當前頁碼
      lastPlayPosition: 0, //定义当前的播放位置
      duration: 0, //定义视频时间长度 - 秒
      endTime: "", //视频时间长度 hh:mm:ss
      current: 0, //定义当前播放进度 - 秒
      currentTime: "00:00:00", //定义当前播放进度时间 hh:mm:ss
      lastPlayTime: 0, //定义上次播放的时间
      fullScreen: false, //是否全屏播放
      normalHeight: 0, //正常状态下的视频高度，用在全屏时控制栏的offset高度
      videoDomReady: false, //视频Dom是否构建完成 - 用以决定是否开始构建菜单栏和控制栏
      videoReady: false, //视频加载是否完成
      timeDrag: false, //进度条是否在被拖曳
      videoHeight: parseInt((window.innerWidth * 9) / 16, 10),
      favorite: false, //当前视频favorite
      isLandScape: isLandscape(),
      showShare: false,
      showAd: showAd,
      beginPlaying: false
    };
    this.windowWidth = isLandscape() ? window.innerHeight : window.innerWidth;
    this.mounted = false;
    this.showMenuTimer = null;
  }
  goBack = e => {
    //e.stopPropagation();
    let video = document.getElementById("currentVideo");
    if (video !== null && this.state.duration !== 0) {
      //获取当前播放时间
      let currentTime = parseInt(video.currentTime, 10);
      //如果当前播放时间超过1秒，记录当前的集数和播放时间（断点播放）
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

  /*  turnOnVolume = () => {
    if (this.state.muted) {
      document.getElementById("currentVideo").muted = false;
      this.setState({
        muted: false
      });
    }
  };*/

  showMenu = () => {
    let video = document.getElementById("currentVideo");

    if (video.readyState !== 4) {
      return;
    }
    // this.turnOnVolume();
    let menuBar = $("#videoNav");
    let controllBar = $("#videoContorl");

    $("#videoNav").fadeIn();
    $("#videoContorl").fadeIn();
    clearTimeout(this.showMenuTimer);
    this.showMenuTimer = setTimeout(() => {
      menuBar.fadeOut();
      controllBar.fadeOut();
    }, 10000);
  };

  //设置时长
  setDuration = () => {
    if (this.mounted) {
      const duration = document.getElementById("currentVideo").duration;
      if (duration == null) {
        return;
      }
      let durationNum = parseInt(duration, 10);
      let durantionTime = numberToTime(durationNum);
      this.setState({
        duration: durationNum,
        endTime: durantionTime
      });
    }
  };
  //更新当前播放时间
  updateTime = () => {
    if (this.mounted) {
      let current = document.getElementById("currentVideo").currentTime;
      // console.log("current: ", current);
      if (typeof current === "undefined") {
        return;
      }

      let currentNum = parseInt(current, 10);
      let currentTime = numberToTime(currentNum);

      this.setState({
        current: currentNum,
        currentTime: currentTime
      });
    }
  };
  //屏幕切换
  switchScreen = () => {
    if (isLandscape()) {
      return;
    }
    // this.turnOnVolume();
    if (!this.state.fullScreen) {
      $("#adComponent").hide();
      $("#currentVideoInfo1").hide();
      $("#videoWrapper").addClass("black-bg");
      $("#currentVideo").addClass("full-screen");
      $("#videoNav").addClass("video-nav-landscape");
      $("#videoContorl").addClass("video-control-landscape");
    } else {
      $("#videoWrapper").removeClass("black-bg");
      $("#currentVideo").removeClass("full-screen");
      $("#videoNav").removeClass("video-nav-landscape");
      $("#videoContorl").removeClass("video-control-landscape");
      $("#adComponent").show();
      $("#currentVideoInfo1").show();
    }
    let fullScreen = !this.state.fullScreen;

    this.setState({
      fullScreen: fullScreen
    });
  };
  //播放切换
  accessPlay = () => {
    // this.turnOnVolume();
    let video = document.getElementById("currentVideo");

    if (!video.paused) {
      video.pause();
      this.setState({
        playing: false
      });
    } else {
      video.play();
      this.setState({
        playing: true
      });
    }
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
      let video = document.getElementById("currentVideo");
      video.pause();
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
        playing: true,
        current: 0, //定义当前播放进度 - 秒
        currentTime: "00:00:00", //定义当前播放进度时间 hh:mm:ss
        lastPlayTime: 0, //定义上次播放的时间
        videoReady: false,
        favorite: favorite
      });

      let source = document.getElementById("videoSource");
      //video.appendChild(source);
      source.setAttribute("src", item.mp4_url);
      video.load();
      video.play();
    }
  };
  playiOSVideo = () => {
    //console.log("play ios video");
    if (this.OS !== "iOS" || this.state.beginPlaying) {
      return;
    }

    let video = document.getElementById("currentVideo");
    if (!isWechat()) {
      video.play();
    } else {
      video.pause();
      let source = document.getElementById("videoSource");
      source.setAttribute("src", this.state.currentVideo.mp4_url);
      video.load();
      video.play();
    }
    this.setState({
      beginPlaying: true
    });
  };
  //视频结束
  videoEnd = () => {
    let selectIndex = this.state.currentVideoIndex + 1;
    selectIndex = selectIndex === this.state.totalCount ? 0 : selectIndex;
    this.selectVideo(this.state.list[selectIndex]);
  };
  //更新进度条
  updateProgressBar = (xPosition, finish) => {
    if (!this.mounted) {
      return;
    }
    let progressBar = $(".progress-bar");
    let videoProges = $("#videoProgress");
    let progressBarWidth = progressBar.width();
    let duration = this.state.duration;
    let position = xPosition - progressBar.offset().left;
    if (position > progressBarWidth) {
      position = progressBarWidth;
    }
    let percentage = (100 * position) / progressBarWidth;
    if (percentage > 100) {
      percentage = 100;
    }
    if (percentage < 0) {
      percentage = 0;
    }
    videoProges.width(parseInt(position, 10));
    let current = parseInt((percentage * duration) / 100, 10);
    let currentTime = numberToTime(current);
    this.setState({
      current: current,
      currentTime: currentTime
    });
    if (finish) {
      let video = document.getElementById("currentVideo");
      video.currentTime = current;
    }
  };

  enableMouseDrag = () => {
    let video = document.getElementById("currentVideo");
    video.pause();
    this.setState({
      timeDrag: true
    });
  };
  disableMouseDrag = () => {
    this.setState({
      timeDrag: false
    });
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
            currentTime = 0,
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
            currentTime = numberToTime(lastPlayTime);
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
              current: lastPlayTime,
              currentTime: currentTime,
              lastPlayPosition: lastPlayTime,
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

  componentDidUpdate() {
    let video = $("#currentVideo");
    if (video !== null) {
      this.setState({
        videoDomReady: true
      });
    }

    //如果视频加载完成，移除等待画面
    video.on("canplay", () => {
      if (this.state.lastPlayPosition > 0) {
        video.get(0).currentTime = this.state.lastPlayPosition;
      }
      this.setState({
        videoReady: true,
        lastPlayPosition: 0
      });
    });

    //监听loadmetadata完成事件，如果完成，设置视频时长
    video.on("loadedmetadata", () => {
      this.setDuration();
      this.setState({
        videoHeight: video.height()
      });
    });

    //监听播放进度事件，更新播放进度
    video.on("timeupdate", this.updateTime);
    video.on("seeking", () => {
      this.setState({
        videoReady: false
      });
    });
    video.on("seeked", () => {
      this.setState({
        videoReady: true
      });
      video.get(0).play();
    });

    let timeDrag = this.state.timeDrag;

    //拖曳进度条

    $("#progress-button").on("touchstart", () => {
      //console.log("mouse down");
      //禁止在全屏模式下拖曳进度条
      if (this.state.fullScreen) {
        return;
      }
      this.enableMouseDrag();
    });
    $("#progress-button").on("touchmove", e => {
      //  console.log("touch move", e);
      //禁止在全屏模式下拖曳进度条
      if (this.state.fullScreen) {
        return;
      }
      if (timeDrag) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          this.updateProgressBar(e.changedTouches[i].pageX, false);
        }
      }
    });
    $("#progress-button").on("touchend", e => {
      //禁止在全屏模式下拖曳进度条
      if (this.state.fullScreen) {
        return;
      }
      if (timeDrag) {
        this.updateProgressBar(e.changedTouches[0].pageX, true);
      }
      this.disableMouseDrag();
    });
    clearInterval(this.checkOrientation);
    this.checkOrientation = setInterval(() => {
      let isLandScape = isLandscape();
      if (this.state.isLandScape !== isLandScape) {
        this.setState({
          isLandScape: isLandScape
        });
      }
    }, 100);
  }
  componentWillUnmount() {
    this.mounted = false;
    clearTimeout(this.showMenuTimer);
  }
  render() {
    let currentPlayVideo;
    let menuBar, controlBar, volumeHint, loading, videoTitle, videoCat, catInfo;

    //设置video
    let srcURL =
      this.OS === "iOS" && isWechat() ? "" : this.state.currentVideo.mp4_url;
    if (this.state.list.length > 0) {
      currentPlayVideo = (
        <video
          id="currentVideo"
          type="video/mp4"
          onClick={() => {
            this.showMenu();
          }}
          autoPlay
          preload="metadata"
          poster={this.state.currentVideo.pre_picture}
          webkit-playsinline="true"
          playsInline={true}
          x-webkit-airplay="allow"
          x5-playsinline="true"
          onEnded={this.videoEnd}
        >
          <source id="videoSource" src={srcURL} type="video/mp4" />
          <p>抱歉，您的瀏覽器無法支持HTML5的視頻播放</p>
        </video>
      );

      loading = null;
    } else {
      currentPlayVideo = null;
    }

    //设置控制栏控件状态
    if (this.state.videoDomReady && currentPlayVideo !== null) {
      let playIcon,
        screenIcon,
        barWidth,
        menuBarXPosition,
        menuBarYPosition,
        controlBarXPosition,
        controlBarYPosition;

      //设置播放/暂停状态
      // console.log("playing: ", this.state.playing);
      if (this.state.playing) {
        playIcon = pauseImg;
      } else {
        playIcon = playImg;
      }
      //设置全屏/正常屏幕图标
      if (this.state.fullScreen) {
        screenIcon = normalScreenImg;
      } else {
        screenIcon = fullScreenImg;
      }
      //设置当前播放时间和总时长
      if (this.state.duration !== 0) {
        let totalWidth = $("#currentVideo").width() * 0.7;
        // console.log("current time: ", this.state.current);

        let progress = (this.state.current / this.state.duration) * totalWidth;
        $("#videoProgress").width(progress);
      }
      //设置菜单栏和控制栏的位置
      let $el = $("#currentVideo");

      barWidth = $el.width();

      if (this.state.isLandScape || this.state.fullScreen) {
        $el.height(this.windowWidth);
      } else {
        $el.height((this.windowWidth * 9) / 16);
      }
      // console.log("bar width: ", barWidth);
      //非全屏状态
      if (!this.state.fullScreen && !this.state.isLandScape) {
        menuBarYPosition = this.state.showAd ? "39px" : 0;
        menuBarXPosition = 0;
        controlBarXPosition = 0;

        let videoBottom = this.state.showAd
          ? (this.windowWidth * 9) / 16 + 38
          : (this.windowWidth * 9) / 16;
        //$el.position().top + $el.offset().top + $el.outerHeight(true);
        controlBarYPosition = videoBottom - 50;
        //controlBarXPosition = videoPosition.left;
      } else if (this.state.fullScreen && !this.state.isLandScape) {
        //全屏状态
        menuBarYPosition = 0;
        controlBarYPosition = 0;
        menuBarXPosition = $el.height() / 2 - 25;
        controlBarXPosition = 0 - $el.height() / 2 + 25;
        barWidth = window.innerHeight;
      } else if (this.state.isLandScape) {
        //横屏状态
        menuBarYPosition = 0;
        controlBarYPosition = window.innerHeight - 50;
        menuBarXPosition = 0;
        controlBarXPosition = 0;
      }
      let menuClass = "video-menu-nav";
      let controllClass = "video-control-bar";
      //if (this.state.muted || !this.state.videoReady) {
      menuClass += " hide";
      controllClass += " hide";
      //}

      //渲染菜单栏
      menuBar = (
        <div
          id="videoNav"
          className={menuClass}
          style={{
            marginTop: menuBarYPosition,
            marginLeft: menuBarXPosition,
            width: barWidth
          }}
        >
          <div
            onClick={e => {
              this.goBack(e);
            }}
            className="video-return-btn"
          >
            <i className="fas fa-chevron-left" />
          </div>

          <span className="nav-title">{this.state.currentVideo.title}</span>
        </div>
      );
      if (!this.state.videoReady) {
        //视频没有准备好时显示载入画面

        let loadingClass = this.state.fullScreen
          ? "waiting-video-ready-landscape"
          : "waiting-video-ready";

        let loadingHeight;
        if (this.state.isLandScape) {
          loadingHeight = "100vh";
        } else {
          loadingHeight = this.state.fullScreen
            ? $("#currentVideo").height()
            : this.state.videoHeight;
        }
        let loadingWidth = this.state.fullScreen
          ? $("#currentVideo").width()
          : Window.innerWidth;
        let marginTop =
          this.state.showAd && !this.state.isLandScape ? "39px" : 0;
        // console.log("video height: ", loadingHeight);
        let imgSource = loadingImg;
        if (this.OS === "iOS" && !this.state.beginPlaying) {
          imgSource = playImg;
        }
        loading = (
          <div
            className={loadingClass}
            style={{
              width: loadingWidth,
              height: loadingHeight,
              marginTop: marginTop
            }}
            onClick={this.playiOSVideo}
          >
            <img src={imgSource} alt="loading" />
          </div>
        );
      } else {
        loading = null;
      }

      //渲染控制栏
      controlBar = (
        <div
          id="videoContorl"
          className={controllClass}
          style={{
            marginTop: controlBarYPosition,
            marginLeft: controlBarXPosition,
            width: barWidth
          }}
        >
          <div
            className="video-play-pause-btn"
            onClick={() => {
              this.accessPlay();
            }}
          >
            <img src={playIcon} alt="play-icon" />
          </div>

          <div className="video-progress-bar">
            <div className="progress-bar">
              <div id="videoProgress">
                <span id="progress-button">
                  <img
                    src={playProgressImg}
                    className="progress-btn"
                    alt="progress-button"
                  />
                </span>
              </div>
            </div>
            <div className="display--current-video-time">
              <div className="video-start-time">{this.state.currentTime}</div>
              <div className="video-end-time">{this.state.endTime}</div>
            </div>
          </div>
          <div
            className="video-screen-control-btn"
            onClick={() => {
              this.switchScreen();
            }}
          >
            <img src={screenIcon} alt="screen-icon" />
          </div>
        </div>
      );
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
    } else {
      menuBar = null;
      controlBar = null;
      videoTitle = null;
      videoCat = null;
    }
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
        {menuBar}
        {volumeHint}
        {loading}
        {controlBar}
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
