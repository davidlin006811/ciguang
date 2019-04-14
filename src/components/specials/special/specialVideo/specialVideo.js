import React, { PureComponent } from "react";
import { numberToTime, isLandscape } from "../../../commonFunctions";
import { SharePreTxt } from "../../../commonConst";
import $ from "jquery";
import Share from "../../../share/share";
import VideoShare from "../../../share/videoShare";
import AD from "../../../ad/ad";
import "../../../component.css";
import "../../../videos/video/video.css";
import "./specialVideo.css";
import playImg from "../../../image/play.svg";
import pauseImg from "../../../image/pause.svg";
import fullScreenImg from "../../../image/full_screen.svg";
import normalScreenImg from "../../../image/normal_screen.svg";
import playProgressImg from "../../../image/play_progress.svg";
import muteImg from "../../../image/mute.svg";
import loadingImg from "../../../image/loading.gif";
import favoriteImg from "../../../image/favorite.svg";
import favoriteNImg from "../../../image/favorite-n.svg";
import shareImg from "../../../image/share.svg";
import replayImg from "../../../image/replay.png";
import hintImg from "../../../image/hint.png";

class SpecialVideo extends PureComponent {
  constructor(props) {
    //console.log(props);
    super(props);
    this.state = {
      list: [], //视频列表
      playing: true, //定义视频是否处在播放状态
      lastPlayPosition: 0, //定义当前的播放位置
      duration: 0, //定义视频时间长度 - 秒
      endTime: "", //视频时间长度 hh:mm:ss
      current: 0, //定义当前播放进度 - 秒
      currentTime: "00:00:00", //定义当前播放进度时间 hh:mm:ss
      lastPlayTime: 0, //定义上次播放的时间
      fullScreen: false, //是否全屏播放
      normalHeight: 0, //正常状态下的视频高度，用在全屏时控制栏的offset高度
      muted: true,
      videoDomReady: false, //视频Dom是否构建完成 - 用以决定是否开始构建菜单栏和控制栏
      videoReady: false, //视频加载是否完成
      timeDrag: false, //进度条是否在被拖曳
      videoHeight: parseInt((window.innerWidth * 9) / 16, 10),
      showShare: false,
      videoEnd: false,
      height: (window.innerWidth * 9) / 16,
      durationWidth: 0, //定义视频的总时长长度
      showAd: this.props.showAD
    };
    this.windowWidth = isLandscape() ? window.innerHeight : window.innerWidth;
    this.mounted = false;
    this.hideMenuTimer = null;
    this.timer = null;
  }
  savePlayTime = () => {
    let video = document.getElementById("currentVideo");
    if (video !== null && this.state.duration !== 0) {
      //获取当前播放时间
      let currentTime = parseInt(video.currentTime, 10);
      //如果当前播放时间超过1秒，记录当前的集数和播放时间（断点播放）
      if (currentTime > 1) {
        let data = {};
        let lastPlayTime = sessionStorage.getItem(
          "special-video-" + this.props.specialId
        );
        if (lastPlayTime !== null) {
          data = JSON.parse(lastPlayTime);
        }

        data[this.state.list[this.state.currentVideoIndex].id] = currentTime;

        sessionStorage.setItem(
          "special-video-" + this.props.specialId,
          JSON.stringify(data)
        );
      }
    }
  };
  resetPlayTime = () => {
    let data = {};
    let lastPlayTime = sessionStorage.getItem(
      "special-video-" + this.props.specialId
    );
    if (lastPlayTime !== null) {
      data = JSON.parse(lastPlayTime);
    }

    data[this.state.list[this.state.currentVideoIndex].id] = 0;

    sessionStorage.setItem(
      "special-video-" + this.props.specialId,
      JSON.stringify(data)
    );
  };
  //返回上级菜单
  goBack = e => {
    this.savePlayTime();
    this.props.goBack();
  };

  turnOnVolume = () => {
    if (this.state.muted) {
      document.getElementById("currentVideo").muted = false;
      this.setState({
        muted: false
      });
    }
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
  /* select love icon color */
  setComment = id => {
    let oldComments;
    oldComments = this.state.comments;
    oldComments[id] = !oldComments[id];
    this.setState(state => ({
      comments: { ...oldComments }
    }));
    let data = JSON.stringify(this.state.comments);
    localStorage.setItem("specialVideo-comments", data);
  };

  showMenu = () => {
    let video = document.getElementById("currentVideo");
    if (video.readyState !== 4) {
      return;
    }
    this.turnOnVolume();
    let menuBar = $("#videoNav");
    let controllBar = $("#videoContorl");

    $("#videoNav").fadeIn();
    $("#videoContorl").fadeIn();
    clearTimeout(this.hideMenuTimer);
    this.hideMenuTimer = setTimeout(() => {
      menuBar.fadeOut();
      controllBar.fadeOut();
    }, 10000);
  };

  //设置时长
  setDuration = () => {
    let duration = document.getElementById("currentVideo").duration;

    if (duration == null) {
      return;
    }

    let durationNum = parseInt(duration, 10);
    let durantionTime = numberToTime(durationNum);
    this.setState({
      duration: durationNum,
      endTime: durantionTime
    });
  };

  //屏幕切换
  switchScreen = () => {
    if (isLandscape()) {
      return;
    }
    //this.turnOnVolume();
    if (!this.state.fullScreen) {
      $("#adComponent").hide();
      $("#currentVideoInfo1").hide();
      $("#currentVideo").addClass("full-screen");
      $("#videoNav").addClass("video-nav-landscape");
      $("#videoContorl").addClass("video-control-landscape");
    } else {
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

  //更新当前播放时间
  updateTime = () => {
    if (!this.mounted) {
      return;
    }
    let current = document.getElementById("currentVideo").currentTime;

    if (typeof current === "undefined") {
      return;
    }

    let currentNum = parseInt(current, 10);
    let currentTime = numberToTime(currentNum);

    this.setState({
      current: currentNum,
      currentTime: currentTime
    });
  };
  //播放切换
  accessPlay = () => {
    //this.turnOnVolume();

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
  //选择视频
  selectVideo = item => {
    if (this.state.list[this.state.currentVideoIndex].id === item.id) {
      return;
    }
    this.savePlayTime();
    let index = this.state.list.findIndex(x => {
      return x.id === item.id;
    });
    let current = 0;
    let currentTime = "00:00:00";
    let lastPlay = sessionStorage.getItem(
      "special-video-" + this.props.specialId
    );
    if (lastPlay !== null) {
      let lastPlayTime = JSON.parse(lastPlay);
      if (lastPlayTime[item.id] !== null && lastPlayTime[item.id] > 0) {
        current = lastPlayTime[item.id];
        currentTime = numberToTime(lastPlayTime[item.id]);
      }
    }

    let video = $("#currentVideo");
    video.get(0).pause();

    this.setState({
      currentVideoIndex: index,
      playing: true,
      current: current, //定义当前播放进度 - 秒
      currentTime: currentTime, //定义当前播放进度时间 hh:mm:ss
      lastPlayPosition: current,
      lastPlayTime: 0, //定义上次播放的时间
      videoReady: false,
      videoEnd: false,
      replay: false
    });

    let source = video.find("#videoSource");

    source.attr("src", item.video);
    source.attr("type", "video/mp4");
    video.get(0).load();
    video.get(0).play();
  };
  replayVideo = () => {
    let video = $("#currentVideo");
    let source = video.find("#videoSource");
    source.attr("src", this.state.list[this.state.currentVideoIndex].video);
    source.attr("type", "video/mp4");
    video.get(0).load();
    video.get(0).play();
    this.setState({
      videoEnd: false,
      videoReady: false,
      videoDomReady: false,
      muted: true,
      replay: true
    });
  };
  //视频结束
  videoEnd = () => {
    let video = $("#currentVideo");
    video.get(0).pause();
    //let landScape = isLandscape() ? true : false;
    this.setState({
      videoEnd: true
      // landScape: landScape
    });

    this.resetPlayTime();
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
    if (percentage >= 100) {
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

  fetchData = () => {
    fetch(this.props.api, { method: "get" })
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
          let currentVideoIndex = 0;
          let selectedId = parseInt(this.props.id, 10);
          let foundIndex = data.data.rows.findIndex(x => {
            return x.id === selectedId;
          });
          if (foundIndex >= 0) {
            currentVideoIndex = foundIndex;
          }
          for (let i = 0; i < data.data.rows.length; i++) {
            let id = data.data.rows[i].id;
            if (oldComments[id] === undefined) {
              oldComments[id] = false;
            }
          }
          let current = 0;
          let currentTime = "00:00:00";
          let lastPlay = sessionStorage.getItem(
            "special-video-" + this.props.specialId
          );
          if (lastPlay !== null) {
            let lastPlayTime = JSON.parse(lastPlay);
            if (lastPlayTime[this.props.id] !== null) {
              current = lastPlayTime[this.props.id];
              currentTime = numberToTime(lastPlayTime[this.props.id]);
            }
          }
          if (this.mounted) {
            this.setState({
              list: data.data.rows,
              currentVideoIndex: currentVideoIndex,
              comments: oldComments,
              current: current,
              currentTime: currentTime,
              lastPlayPosition: current
            });
          }
        }
      });
  };
  closeAd = () => {
    this.setState({
      showAd: false
    });
  };
  componentDidMount() {
    this.mounted = true;
    let comments;
    let storeComments = localStorage.getItem("specialVideo-comments");
    if (storeComments !== null) {
      comments = JSON.parse(storeComments);
      this.setState({
        comments: comments
      });
    }
    this.fetchData();
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
      if (this.state.playing) {
        video.get(0).play();
      }
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
    if (this.state.muted) {
      setTimeout(() => {
        $("#muteTxt").fadeOut();
      }, 5000);
    }
    let timeDrag = this.state.timeDrag;

    //拖曳进度条

    $("#progress-button").on("touchstart", () => {
      //禁止在全屏模式下拖曳进度条
      if (this.state.fullScreen) {
        return;
      }
      this.enableMouseDrag();
    });
    $("#progress-button").on("touchmove", e => {
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
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      let landScape = isLandscape();
      // console.log("landscape: ", landScape);
      if (landScape !== this.state.landScape) {
        this.setState({
          landScape: landScape
        });
      }
    }, 100);
  }
  componentWillUnmount() {
    this.mounted = false;
    clearInterval(this.timer);
    clearTimeout(this.hideMenuTimer);
  }
  render() {
    let currentPlayVideo;
    let menuBar,
      controlBar,
      volumeHint,
      loading,
      videoTitle,
      title,
      shareUrl,
      videoShare;

    //设置video
    if (this.state.list.length > 0) {
      title = this.state.list[this.state.currentVideoIndex].title;
      shareUrl =
        SharePreTxt +
        "/special/video?client=h5&v=2&id=" +
        this.state.list[this.state.currentVideoIndex].id +
        "&special_id=" +
        this.props.specialId;
      currentPlayVideo = (
        <video
          id="currentVideo"
          type="video/mp4"
          onClick={() => {
            this.showMenu();
          }}
          autoPlay
          muted
          preload="metadata"
          poster={this.state.list[this.state.currentVideoIndex].cover}
          webkit-playsinline="true"
          playsInline={true}
          x-webkit-airplay="allow"
          x5-playsinline="true"
          onEnded={this.videoEnd}
        >
          <source
            id="videoSource"
            src={this.state.list[this.state.currentVideoIndex].video}
            type="video/mp4"
          />
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
        controlBarYPosition = this.state.videoHeight - 50;

      //设置播放/暂停状态

      if (this.state.playing && !this.state.videoEnd) {
        playIcon = pauseImg;
      } else if (!this.state.playing && !this.state.videoEnd) {
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
        let progress = (this.state.current / this.state.duration) * totalWidth;
        $("#videoProgress").width(progress);
      }
      //设置菜单栏和控制栏的位置
      let $el = $("#currentVideo");

      barWidth = $el.width();

      //非全屏状态
      if (!this.state.fullScreen && !this.state.landScape) {
        menuBarYPosition = this.state.showAd ? "39px" : 0;
        menuBarXPosition = 0;

        /* let videoBottom = this.state.videoEnd
          ? this.state.videoHeight
          : $el.position().top + $el.offset().top + $el.outerHeight(true);*/
        let videoBottom = this.state.showAd
          ? (this.windowWidth * 9) / 16 + 38
          : (this.windowWidth * 9) / 16;
        controlBarYPosition = videoBottom - 50;
        controlBarXPosition = 0;
      } else if (this.state.fullScreen && !this.state.landScape) {
        //全屏状态
        menuBarYPosition = 0;
        controlBarYPosition = 0;
        menuBarXPosition = $el.height() / 2 - 25;
        controlBarXPosition = 0 - $el.height() / 2 + 25;
      } else if (this.state.landScape) {
        //横屏状态
        menuBarYPosition = 0;
        controlBarYPosition = $el.height() - 50;
        menuBarXPosition = 0;
        controlBarXPosition = 0;
      }
      let menuClass = "video-menu-nav";
      let controllClass = "video-control-bar";
      if (this.state.muted) {
        menuClass += " hide";
        controllClass += " hide";
      }

      //视频播放完毕后显示分享界面

      if (this.state.videoEnd) {
        let cover = this.state.list[this.state.currentVideoIndex].cover;
        let shareHeight;
        let shareWidth = window.innerWidth;
        if (this.state.landScape) {
          shareHeight = window.innerHeight;
        } else {
          shareHeight = this.state.height;
        }
        let marginTop = this.state.showAd && !this.state.landScape ? "39px" : 0;
        videoShare = (
          <div
            className="video-share"
            style={{
              height: shareHeight,
              backgroundImage: "url(" + cover + ")",
              backgroundSize: shareWidth,
              marginTop: marginTop
            }}
          >
            <div
              onClick={e => {
                this.goBack(e);
              }}
              className="video-share-return-btn"
            >
              <i className="iconfont">&#xe66f;</i>
            </div>
            <div className="video-replay">
              <img src={replayImg} alt="replay" onClick={this.replayVideo} />
              <span onClick={this.replayVideo}>重播</span>
            </div>

            <VideoShare
              url={shareUrl}
              title={this.state.list[this.state.currentVideoIndex].title}
              image={this.state.list[this.state.currentVideoIndex].cover}
              description={this.state.list[this.state.currentVideoIndex].title}
              landscape={this.state.landScape}
            />
          </div>
        );
      }

      //渲染菜单栏
      if (!this.state.videoEnd) {
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
              <i className="iconfont">&#xe66f;</i>
            </div>

            <span className="nav-title">{title}</span>
          </div>
        );
      }

      if (!this.state.videoReady) {
        //视频没有准备好时显示载入画面

        let loadingClass = this.state.fullScreen
          ? "waiting-video-ready-landscape"
          : "waiting-video-ready";

        let loadingHeight;
        if (this.state.landScape) {
          loadingHeight = (window.innerWidth * 9) / 16;
        } else {
          loadingHeight = this.state.fullScreen
            ? $("#currentVideo").height()
            : this.state.videoHeight;
        }
        let loadingWidth = this.state.fullScreen
          ? $("#currentVideo").width()
          : Window.innerWidth;
        let marginTop = this.state.showAd && !this.state.landScape ? "39px" : 0;
        loading = (
          <div
            className={loadingClass}
            style={{
              width: loadingWidth,
              height: loadingHeight,
              marginTop: marginTop
            }}
          >
            <img src={loadingImg} alt="loading" />
          </div>
        );
      }

      //设置声音开启
      if (this.state.muted) {
        let hint = this.state.replay ? "点击显示控制栏" : "点击取消静音";
        let messageIco = this.state.replay ? hintImg : muteImg;
        let marginTop =
          this.state.showAd && !this.state.landScape ? "39px" : "0";
        volumeHint = (
          <div className="volume-hint" style={{ marginTop: marginTop }}>
            <img src={messageIco} alt="muted" />
            <span id="muteTxt">{hint}</span>
          </div>
        );
      } else {
        volumeHint = null;
      }
      //渲染控制栏
      if (!this.state.videoEnd) {
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
          <span>{title}</span>
          <span style={{ paddingLeft: "85%" }}>{title}</span>
        </marquee>
      );
    } else {
      menuBar = null;
      controlBar = null;
      videoTitle = null;
    }

    //显示分享和喜爱
    let favImg;
    if (this.state.list.length > 0) {
      favImg = this.state.comments[
        this.state.list[this.state.currentVideoIndex].id
      ]
        ? favoriteImg
        : favoriteNImg;
    }

    //显示剩余的视频列表
    let restVideoList;
    if (this.state.list.length > 0) {
      restVideoList = this.state.list.map((item, index) => {
        if (index !== this.state.currentVideoIndex) {
          return (
            <div
              className="special-videoItem"
              key={item.id}
              onClick={() => {
                this.selectVideo(item);
              }}
            >
              <div className="special-video-cover">
                <img src={item.cover} alt="cover" />
                <div className="special-play-icon">
                  <img src={playImg} alt="play" />
                </div>
              </div>
              <div className="special-videoItem-title">{item.title}</div>
            </div>
          );
        }
      });
    }
    //设置分享界面
    let shareComponent;
    if (this.state.showShare) {
      shareComponent = (
        <div className="share-component">
          <Share
            url={shareUrl}
            title={this.state.list[this.state.currentVideoIndex].title}
            image={this.state.list[this.state.currentVideoIndex].cover}
            description={this.state.list[this.state.currentVideoIndex].title}
            hideShare={this.hideShare}
          />
        </div>
      );
    }
    let ad;
    if (this.state.showAd && !this.state.landScape) {
      ad = <AD closeAd={this.closeAd} />;
    }
    return (
      <div className="video-wrapper">
        {ad}
        {menuBar}
        {volumeHint}
        {loading}
        {videoShare}
        {controlBar}
        {currentPlayVideo}

        <div id="currentVideoInfo1" className="moving-title">
          <div className="current-program-title"> {videoTitle}</div>
          <div className="special-video-info">
            <div className="special-video-title">
              <span>{title}</span>
            </div>
            <div className="special-video-share">
              <img src={shareImg} alt="share" onClick={this.showShare} />
              <img
                src={favImg}
                alt="favorite"
                onClick={() => {
                  this.setComment(
                    this.state.list[this.state.currentVideoIndex].id
                  );
                }}
              />
            </div>
            <div className="special-video-list">
              {restVideoList}
              {shareComponent}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
export default SpecialVideo;
