import React from "react";
import videojs from "video.js";
import $ from "jquery";
import playProgressImg from "./image/play_progress.svg";
import posterImg from "./image/video_poster.jpg";
import loadingImg from "./image/loading.gif";
import fullScreenImg from "./image/full_screen.svg";
import normalScreenImg from "./image/normal_screen.svg";
import playImg from "./image/play.svg";
import backImg from "./image/back.svg";
import muteImg from "./image/mute.svg";
import pauseImg from "./image/pause.svg";
import refreshImg from "./image/refresh.png";
import "./videoPlayer.css";

export default class VideoPlayer extends React.Component {
  constructor(props) {
    super(props);
    console.log(props);
    const poster = this.props.poster ? this.props.poster : posterImg;
    this.state = {
      title: props.title,
      poster: poster,
      selectedResolution: props.selectedResolution,
      showDropDown: props.showDropDown,
      repeat: props.repeat,
      muted: true,
      isLandScape: false,
      videoEnd: false,
      isPlaying: false,
      fullScreen: false,
      resList: props.resList,
      allowShowResolutionMenu: false,
      switchResolution: props.switchResolution,
      virtualMode: props.virtualMode,
      url: props.url,
      hideControl: props.hideControl
    };

    this.mounted = true;
    this.lastTime = -1;
    this.tryTimes = 0;
    this.timer = null;
    this.hideMenuTimeout = null;
    this.isVideoBreak = null;
    this.orientationTimer = null;
    this.delayTimeToCheck = null;
    this.delayTimeToPlay = null;
  }
  //返回上级菜单
  goBack = e => {
    let currentTime = this.player.currentTime();
    this.props.goBack(currentTime);
  };
  turnOnVolume = () => {
    const videoId = this.player.id() + "_html5_api";
    document.getElementById(videoId).muted = false;
    this.setState({
      muted: false
    });
    console.log(this.state);
  };
  showMenu = () => {
    this.turnOnVolume();
    let menuBar = $("#videoNav");
    let controllBar = $("#videoControl");
    $("#videoNav").fadeIn();
    $("#videoControl").fadeIn();
    let delayTime = this.isLandscape() ? 60000 : 10000;
    clearTimeout(this.hideMenuTimeout);
    this.hideMenuTimeout = setTimeout(() => {
      menuBar.fadeOut();
      controllBar.fadeOut();
    }, delayTime);
  };
  numberToTime = number => {
    let hours = parseInt(number / 3600, 10);
    let minutes = parseInt((number - hours * 3600) / 60, 10);
    let seconds = number - hours * 3600 - minutes * 60;
    let hourTxt = hours >= 10 ? hours : "0" + hours;
    let minuTxt = minutes >= 10 ? minutes : "0" + minutes;
    let secondTxt = seconds >= 10 ? seconds : "0" + seconds;
    return hourTxt + ":" + minuTxt + ":" + secondTxt;
  };
  //判读是否横屏
  isLandscape = () => {
    return window.orientation === 90 || window.orientation === -90;
  };
  //更新进度条
  updateProgress = e => {
    if (!this.mounted) {
      return;
    }
    let xPosition = this.state.fullScreen ? e.clientY : e.clientX;
    this.updateProgressBar(xPosition);
  };
  updateProgressBar = xPosition => {
    let progressBar = $(".progress-bar");
    let videoProges = $("#videoProgress");
    let progressBarWidth = progressBar.width();
    let duration = this.state.duration;
    let position = this.state.fullScreen
      ? xPosition - progressBar.offset().top
      : xPosition - progressBar.offset().left;
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
    let currentTime = this.numberToTime(current);
    this.setState({
      current: current,
      currentTime: currentTime,
      needSeek: true
    });

    this.player.currentTime(current);
    this.player.play();
  };

  //设置时长
  setDuration = () => {
    if (!this.state.virtualMode || !this.mounted) {
      return;
    }
    let id = this.player.id() + "_html5_api";
    let duration = document.getElementById(id).duration;

    if (duration == null) {
      return;
    }

    let durationNum = parseInt(duration, 10);
    let durantionTime = this.numberToTime(durationNum);
    this.setState({
      duration: durationNum,
      endTime: durantionTime
    });
  };
  //更新当前播放时间
  updateTime = () => {
    let current = this.player.currentTime();

    let currentNum = parseInt(current, 10);
    let currentTime = this.numberToTime(currentNum);
    if (this.mounted) {
      this.setState({
        current: currentNum,
        currentTime: currentTime
      });
    }
  };
  //在回放模式下重播已经播完的视频
  replayVideo = () => {
    this.setState({
      needSeek: true,
      videoEnd: false,
      replay: true
    });

    this.player.pause();
    /* let type = this.props.virtualMode
      ? "video/mp4"
      : "application/vnd.apple.mpegURL";
    this.player.src([
      {
        type: type,
        src: this.state.url
      }
    ]);*/
    clearTimeout(this.delayTimeToPlay);
    this.delayTimeToPlay = setTimeout(() => {
      this.player.play();
    }, 3000);
  };

  //播放切换
  accessPlay = () => {
    //this.turnOnVolume();

    if (!this.player.paused()) {
      this.player.pause();
      this.setState({
        playing: false
      });
    } else {
      this.player.play();
      this.setState({
        playing: true
      });
    }
  };
  //屏幕切换
  switchScreen = () => {
    if (this.isLandscape()) {
      return;
    }

    if (!this.state.fullScreen) {
      $("#videoOuter").addClass("mask-full-screen");
      $("#videoBackground").addClass("background-full-screen");
      $("#vjs_video_3").addClass("full-screen");
      $("#vjs_video_3_html5_api").addClass("video-full-screen");
      $("#videoNav").addClass("mask-nav-landscape");
      $("#videoControl").addClass("mask-control-landscape");
      this.props.fullScreen();
    } else {
      $("#videoOuter").removeClass("mask-full-screen");
      $("#videoBackground").removeClass("background-full-screen");
      $("#vjs_video_3").removeClass("full-screen");
      $("#vjs_video_3_html5_api").removeClass("video-full-screen");
      $("#videoNav").removeClass("mask-nav-landscape");
      $("#videoControl").removeClass("mask-control-landscape");
      this.props.normalScreen();
    }
    let fullScreen = !this.state.fullScreen;

    this.setState({
      fullScreen: fullScreen
    });
  };
  reloadVideo = () => {
    this.setState({
      reloadVideo: true,
      isPlaying: false,
      needSeek: false,
      showBuffer: false,
      videoJam: false
    });
    this.player.pause();
    this.player.play();
  };

  checkVideoJam = () => {
    if (this.state.isPlaying) {
      clearInterval(this.isVideoBreak);

      this.isVideoBreak = setInterval(() => {
        let currentTime = this.player.currentTime();

        if (currentTime === this.lastTime) {
          this.tryTimes += 1;
          if (this.tryTimes > 6) {
            this.setState({
              videoJam: true
            });
            this.tryTimes = 0;
          }
        } else {
          this.lastTime = currentTime;
          this.tryTimes = 0;
          if (this.state.videoJam) {
            this.setState({
              videoJam: false
            });
          }
        }
      }, 500);
    }
  };
  handleResolutionMenu = () => {
    let status = !this.state.allowShowResolutionMenu;
    this.setState({
      allowShowResolutionMenu: status
    });
  };
  setRes = item => {
    console.log("set resolution: ", item);
    this.setState({
      allowShowResolutionMenu: false,
      isPlaying: false
    });
    this.props.setRes(item);
  };
  getVideoType = url => {
    let lastPos = url.lastIndexOf(".");
    return url.slice(lastPos + 1);
  };

  componentDidMount() {
    // instantiate Video.js
    console.log(this.state);
    const option = {
      autoplay: true,
      controls: false,
      muted: true,
      children: []
    };

    this.player = videojs(this.videoNode, option, function onPlayerReady() {
      console.log("onPlayerReady", this);

      this.setState({
        videoReady: true
      });
    });

    let type =
      this.getVideoType(this.state.url) === "mp4" || this.props.videoMode
        ? "video/mp4"
        : "application/vnd.apple.mpegURL";
    console.log("video type: ", type);
    this.player.src([
      {
        type: type,
        src: this.state.url
      }
    ]);

    if (this.props.lastPlayTime && this.props.virtualMode) {
      console.log("last play time: ", this.props.lastPlayTime);
      this.player.currentTime(this.props.lastPlayTime);
    }
    this.player.on("loadstart", () => {
      this.setState({
        loadstarting: true,
        reloadVideo: false,
        videoEnd: false
      });
    });
    this.player.on("canplay", () => {
      this.setState({
        needSeek: false,
        showBuffer: false,
        videoJam: false,
        replay: false,
        isPlaying: true
      });
      if (this.player.paused) {
        this.player.play();
      }
      //视频卡顿及处理
      clearTimeout(this.delayTimeToCheck);
      this.delayTimeToCheck = setTimeout(this.checkVideoJam, 30000);
    });
    this.player.on("loadedmetadata", () => {
      if (this.state.virtualMode) {
        this.setDuration();
      }
    });
    this.player.on("progress", () => {
      if (this.state.loadstarting) {
        this.setState({
          loadstarting: false,
          showBuffer: true
        });
      }
    });
    //监听播放进度事件，更新播放进度
    this.player.on("timeupdate", () => {
      if (this.state.virtualMode) {
        this.updateTime();
      }
    });

    // if (this.state.OS === "iOS") {
    this.player.on("seeking", () => {
      //console.log("seeking");
      if (!this.state.needSeek) {
        this.setState({
          needSeek: true
        });
      }
    });
    this.player.on("seeked", () => {
      if (this.state.needSeek) {
        // console.log("set seek finish");
        this.setState({
          needSeek: false
        });
      }
    });
    this.player.on("playing", () => {
      this.setState({
        isPlaying: true,
        playing: true
      });
    });
    this.player.on("ended", () => {
      let landscape = this.isLandscape() ? true : false;
      this.setState({
        needSeek: false,
        videoEnd: true,
        playing: false,
        isPlaying: false,
        landscape: landscape
      });
      if (this.state.repeat) {
        this.replayVideo();
      } else {
        this.props.videoEnd();
      }
    });

    this.orientationTimer = setInterval(() => {
      let landScape = this.isLandscape();
      if (landScape !== this.state.isLandScape) {
        this.setState({
          isLandScape: landScape
        });
      }
    }, 100);
  }
  componentWillReceiveProps(nextProps) {
    console.log("next props: ", nextProps);
    if (
      nextProps.url !== this.props.url ||
      nextProps.selectedResolution !== this.props.selectedResolution
    ) {
      const poster = nextProps.poster ? nextProps.poster : posterImg;
      this.setState({
        title: nextProps.title,
        poster: poster,
        repeat: nextProps.repeat,
        virtualMode: nextProps.virtualMode,
        selectedResolution: nextProps.selectedResolution,
        showDropDown: nextProps.showDropDown,
        resList: nextProps.resList,
        lastPlayTime: nextProps.lastPlayTime,
        videoEnd: false,
        isPlaying: false,
        url: nextProps.url
      });
      //this.player.pause();
      setTimeout(() => {
        console.log(this.state);
        let type =
          this.getVideoType(nextProps.url) === "mp4" || nextProps.videoMode
            ? "video/mp4"
            : "application/vnd.apple.mpegURL";
        console.log("video type: ", type);
        this.player.src([
          {
            type: type,
            src: this.state.url
          }
        ]);
        if (nextProps.lastPlayTime && nextProps.virtualMode) {
          console.log("last play time: ", nextProps.lastPlayTime);
          this.player.currentTime(nextProps.lastPlayTime);
        }
        //this.player.play();
      }, 300);
    }
  }

  // destroy player on unmount
  componentWillUnmount() {
    this.mounted = false;
    clearInterval(this.orientationTimer);
    clearInterval(this.isVideoBreak);
    clearInterval(this.timer);
    clearTimeout(this.hideMenuTimeout);
    clearTimeout(this.delayTimeToCheck);
    clearTimeout(this.delayTimeToPlay);
    this.player.dispose();
  }

  render() {
    // console.log(this.state);

    let videoWidth = window.innerWidth;
    let videoHeight = this.state.isLandScape
      ? window.innerHeight
      : (window.innerWidth * 9) / 16;
    // console.log("video height: ", videoHeight);
    let marginTop =
      this.state.showAd && !this.state.landScape && !this.state.fullScreen
        ? "39px"
        : 0;
    let loading;

    if (!this.state.videoJam) {
      if (
        !this.state.isPlaying ||
        this.state.needSeek ||
        this.state.switchResolution
      ) {
        //视频没有准备好时显示载入画面
        let message;
        if (this.state.loadstarting) {
          message = "正在加载视频 ...";
        } else if (this.state.showBuffer) {
          message = "正在缓冲 ...";
        } else if (this.state.reloadVideo) {
          message = "正在重新加载 ...";
        } else if (this.state.switchResolution) {
          message = "正在切换到" + this.state.selectedResolution;
        } else if (this.state.needSeek) {
          message = "正在初始化视频...";
        } else {
          message = "正在加载";
        }

        loading = (
          <div
            className="video-loading"
            style={{ height: "100%", width: "100%" }}
          >
            <img src={loadingImg} alt="loading" style={{ width: "40px" }} />
            <p>{message}</p>
          </div>
        );
      } else {
        loading = null;
      }
    } else {
      loading = (
        <div
          className="video-loading"
          style={{ height: "100%", width: "100%" }}
        >
          <img
            src={refreshImg}
            alt="refresh"
            style={{ width: "40px" }}
            onClick={this.reloadVideo}
          />
          <p>您的网速有点慢，刷新下试试</p>
        </div>
      );
    }
    /* 菜单栏及控制栏  */
    let screenIcon,
      playIcon,
      volumeHint,
      menuBar,
      controlBar,
      menuBarYPosition,
      controlBarXPosition,
      controlBarYPosition,
      $el,
      resolutionIconLandscape,
      resolutionListLandscape;

    if (this.state.playing && !this.state.videoEnd) {
      playIcon = pauseImg;
    } else if (!this.state.playing && !this.state.videoEnd) {
      playIcon = playImg;
    }
    let menuClass = "video-menu-nav";
    let controllClass = "video-control-bar";
    if (!this.state.allowShowMenu) {
      menuClass += " hide";
      controllClass += " hide";
    }
    if (this.player) {
      let id = "#" + this.player.id() + "_html5_api";
      $el = $(id);

      $el.height(videoHeight);
      if (this.state.showDropDown) {
        $el.hide();
      } else {
        $el.show();
      }
    }

    if (this.state.isPlaying) {
      //设置全屏/非全屏图标
      if (this.state.fullScreen) {
        screenIcon = normalScreenImg;
      } else {
        screenIcon = fullScreenImg;
      }
      //设置当前播放时间和总时长
      if (this.state.virtualMode && this.state.duration !== 0) {
        let totalWidth = $el.width() * 0.7;
        let progress = (this.state.current / this.state.duration) * totalWidth;
        //console.log("progress: ", progress);
        $("#videoProgress").width(progress);
      }
      //设置菜单栏和控制栏的位置

      //非全屏状态

      if (!this.state.fullScreen && !this.state.isLandScape) {
        //menuBarYPosition = videoPosition.top;
        menuBarYPosition = 0;
        controlBarYPosition = videoHeight - 50;
      } else if (this.state.fullScreen && !this.state.isLandScape) {
        //全屏状态
        menuBarYPosition = 0;
        controlBarYPosition = 0;
      } else if (this.state.isLandScape) {
        //横屏状态
        menuBarYPosition = 0;
        controlBarYPosition = videoHeight - 50;
      }
      //菜单栏
      if (!this.state.videoEnd) {
        menuBar = (
          <div
            id="videoNav"
            className={menuClass}
            style={{
              marginTop: menuBarYPosition,
              marginLeft: "0"
            }}
          >
            <img
              src={backImg}
              alt="back"
              onClick={e => {
                this.goBack(e);
              }}
              className="video-return-btn"
            />

            <span className="nav-title">{this.state.title}</span>
          </div>
        );
      }
      //渲染控制栏

      if (
        this.state.virtualMode &&
        !this.state.videoEnd &&
        !this.state.hideControl
      ) {
        controlBar = (
          <div
            id="videoControl"
            className={controllClass}
            style={{
              marginTop: controlBarYPosition,
              marginLeft: controlBarXPosition
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
              <div className="progress-bar" onClick={this.updateProgress}>
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
            <div className="video-screen-control-btn">
              <img
                src={screenIcon}
                alt="screen-icon"
                onClick={e => {
                  e.stopPropagation();
                  this.switchScreen();
                }}
              />
            </div>
          </div>
        );
      } else if (!this.state.virtualMode && this.state.selectedResolution) {
        if (this.isLandscape() || this.state.fullScreen) {
          resolutionIconLandscape = (
            <div
              className="resolution-selection-landscape"
              onClick={e => {
                e.stopPropagation();
                this.handleResolutionMenu();
              }}
            >
              {this.state.selectedResolution}
            </div>
          );
        }
        controlBar = (
          <div
            id="videoControl"
            className={controllClass}
            style={{
              marginTop: controlBarYPosition,
              marginLeft: controlBarXPosition
            }}
          >
            <div
              className="video-screen-control-btn text-right-align"
              onClick={() => {
                this.switchScreen();
              }}
            >
              {resolutionIconLandscape}
              <img src={screenIcon} alt="screen-icon" />
            </div>
          </div>
        );
      } else if (this.state.hideControl) {
        controlBar = (
          <div
            id="videoControl"
            className={controllClass}
            style={{
              marginTop: controlBarYPosition,
              marginLeft: controlBarXPosition
            }}
          >
            <div
              className="video-screen-control-btn text-right-align"
              onClick={() => {
                this.switchScreen();
              }}
            >
              <img src={screenIcon} alt="screen-icon" />
            </div>
          </div>
        );
      }
    }
    //设置声音开启
    if (this.state.muted) {
      volumeHint = (
        <div className="volume-hint">
          <img src={muteImg} alt="muted" />
          <span id="muteTxt">点击取消静音</span>
        </div>
      );
    } else {
      volumeHint = null;
    }
    //设置分辨率列表
    if (this.isLandscape() && this.state.allowShowResolutionMenu) {
      let rightPos = window.innerWidth * 0.03 + 40;
      let height = 35 * this.state.resList.length;

      resolutionListLandscape = (
        <div
          className="resolution-list-landscape"
          style={{ right: rightPos, height: height }}
        >
          <ul>
            {this.state.resList.map((item, index) => {
              let itemColor =
                item === this.state.selectedResolution ? "#fd7d02" : "#fff";
              return (
                <li
                  style={{ color: itemColor }}
                  onClick={() => {
                    this.setRes(item);
                  }}
                  key={index}
                >
                  {item}
                </li>
              );
            })}
          </ul>
        </div>
      );
    }
    return (
      <div>
        <div
          id="videoOuter"
          style={{ height: videoHeight }}
          className="mask"
          onClick={() => {
            this.showMenu();
          }}
        >
          {menuBar}
          {volumeHint}
          {loading}
          {resolutionListLandscape}
          {controlBar}
        </div>
        <div
          data-vjs-player
          style={{
            width: videoWidth,
            height: videoHeight,
            marginTop: marginTop,
            backgroundColor: "#000"
          }}
        >
          <video
            ref={node => (this.videoNode = node)}
            poster={this.state.poster}
            width={videoWidth}
            height={videoHeight}
            x5-playsinline="true"
            webkit-playsinline="true"
            playsInline={true}
            className="video-js"
          />
        </div>
      </div>
    );
  }
}
