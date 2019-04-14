import React, { PureComponent } from "react";
import {
  getMobileOperatingSystem,
  isLandscape,
  numberToTime,
  isWechat
} from "../../../commonFunctions";
import { SharePreTxt } from "../../../commonConst";
import $ from "jquery";
import videojs from "video.js";
import Modal from "../../../modal/modal";
import VideoShare from "../../../share/videoShare";
import DropDown from "../../../dropdown/dropdown";
import AD from "../../../ad/ad";
import "../../../component.css";
import "../../../videos/video/video.css";
import "../../../virtual/live.css";
import "./specialLive.css";
import playProgressImg from "../../../image/play_progress.svg";
import posterImg from "../../../image/video_poster.jpg";
import loadingImg from "../../../image/loading.gif";
import fullScreenImg from "../../../image/full_screen.svg";
import normalScreenImg from "../../../image/normal_screen.svg";
import playImg from "../../../image/play.svg";
import smallPlayIcon from "../../../image/play_icon.svg";
import muteImg from "../../../image/mute.svg";
import replayImg from "../../../image/replay.png";
import pauseImg from "../../../image/pause.svg";
import refreshImg from "../../../image/refresh.png";
class SpecialLive extends PureComponent {
  constructor(props) {
    super(props);
    let virtualMode = false;
    if (
      this.props.episodeId !== undefined &&
      this.props.programId !== undefined
    ) {
      virtualMode = true;
    }
    this.state = {
      loadFinish: true,
      schedule: [],
      currentProgram: {}, //当前的节目
      localTime: {}, //现在的当地时间
      enableLive: true, //允许直播
      videoReady: false, //视频准备
      isPlaying: false, //是否正在播放
      fullScreen: false, //是否全屏
      programReady: false, //节目是否准备好
      firstLoad: true, //是否第一次加载视频
      muted: true, //是否静音
      allowShowMenu: false,
      height: (window.innerWidth * 9) / 16,
      width: 0,
      virtualMode: virtualMode, //定义是否强制轮播模式
      currentProgramIndex: 0, //定义当前节目索引
      showModal: false, //定义是否显示对话框
      selectedProgramIndex: -1, //定义选择的节目索引
      OS: null, //定义操作平台
      needSeek: true,
      videoEnd: false, //在回放模式下视频是否播完
      replay: false,
      timerDrag: false,
      duration: 0, //定义视频时间长度 - 秒
      endTime: "", //视频时间长度 hh:mm:ss
      current: 0, //定义当前播放进度 - 秒
      currentTime: "00:00:00", //定义当前播放进度时间 hh:mm:ss,
      nonAppleVideoInitialization: false,
      currentDate: "",
      showAD: this.props.showAD,
      fetchSuccess: false,
      allowShowResolutionMenu: false
    };
    this.lastTime = -1;
    this.tryTimes = 0;
    this.timer = null;
    this.hideMenuTimeout = null;
    this.isVideoBreak = null;
    this.orientationTimer = null;
    this.mounted = false;
  }
  //返回上级菜单
  goBack = e => {
    this.props.goBack();
  };
  turnOnVolume = () => {
    if (this.state.muted) {
      document.getElementById("playVideo").muted = false;
      this.setState({
        muted: false
      });
    }
  };
  showMenu = () => {
    this.turnOnVolume();
    let menuBar = $("#videoNav");
    let controllBar = $("#videoContorl");
    $("#videoNav").fadeIn();
    $("#videoContorl").fadeIn();
    let delayTime = isLandscape() ? 60000 : 10000;
    clearTimeout(this.hideMenuTimeout);
    this.hideMenuTimeout = setTimeout(() => {
      menuBar.fadeOut();
      controllBar.fadeOut();
    }, delayTime);
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
      this.setState({
        needSeek: true
      });
      let video =
        this.state.OS === "iOS"
          ? document.getElementById("playVideo")
          : document.getElementById("playVideo_html5_api");
      video.currentTime = current;
      if (this.state.OS !== "iOS") {
        video.play();
      }
    }
  };
  calcTime = timestamp => {
    // create Date object for current location
    let d = new Date(timestamp);
    let utc = d.getTime() + d.getTimezoneOffset() * 60000;
    let nd = new Date(utc + 3600000 * 8);
    return nd.getDate();
  };
  getHKDate = () => {
    let d = new Date();
    let utc = d.getTime() + d.getTimezoneOffset() * 60000; //获取UTC时间
    let nd = new Date(utc + 3600000 * 8); //获取中国时区时间
    let year = nd.getFullYear();
    let day = nd.getDate();
    let month = nd.getMonth() + 1;
    month = month > 12 ? 1 : month;
    return year + "-" + month + "-" + day;
  };

  //在OS系统下播放视频
  playOSVideo = (url, type = "application/vnd.apple.mpegURL") => {
    let video = $("#playVideo");
    if (typeof video === undefined) {
      return;
    }
    video.get(0).pause();
    let source = video.find("#videoSource");
    source.attr("src", url);
    source.attr("type", type);
    video.get(0).load();
  };
  //在非OS系统下播放视频
  playNonOSVideo = url => {
    let player = videojs("playVideo");
    player.pause();
    player.src(url);
  };

  //播放切换
  accessPlay = () => {
    //this.turnOnVolume();
    let video =
      this.state.OS === "iOS"
        ? document.getElementById("playVideo")
        : document.getElementById("playVideo_html5_api");
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
  //出咯下一节目
  handleNextProgram = () => {
    let current = new Date().getTime() / 1000;
    if (
      current >
        this.state.schedule[this.state.schedule.length - 1].end_timestamp ||
      this.state.currentProgramIndex === this.state.schedule.length - 1
    ) {
      return;
    }

    if (current > this.state.currentProgram.end_timestamp) {
      let nextIndex =
        this.state.currentProgramIndex + 1 >= this.state.schedule.length
          ? 0
          : this.state.currentProgramIndex + 1;
      while (
        this.state.schedule[nextIndex].start_timestamp !==
          this.state.currentProgram.end_timestamp &&
        nextIndex < this.state.schedule.length
      ) {
        nextIndex++;
      }
      let nextProgram = this.state.schedule[nextIndex];
      this.setState({
        currentProgram: nextProgram,
        currentProgramIndex: nextIndex
      });
      if (this.state.OS !== "iOS") {
        if (this.state.virtualMode) {
          this.playNonOSVideo(this.state.currentProgram.mp4_url);
        }
      } else {
        if (this.state.virtualMode) {
          this.playOSVideo(this.state.currentProgram.mp4_url, "video/mp4");
        }
      }
    }
  };
  getCurrentIndexById = () => {
    let episodeId = parseInt(this.props.episodeId, 10);
    let programId = parseInt(this.props.programId, 10);
    let foundIndex = this.state.schedule.findIndex(x => {
      return x.episode === episodeId && x.id === programId;
    });
    if (foundIndex < 0) {
      foundIndex = 0;
    }

    return foundIndex;
  };
  //获取当前时间在节目中的索引
  getCurrentIndexByTime = () => {
    let currentTimeStamp = new Date().getTime() / 1000;
    // console.log("current timestamp: ", currentTimeStamp);
    let foundIndex = this.state.schedule.findIndex(x => {
      return (
        currentTimeStamp >= x.start_timestamp &&
        currentTimeStamp < x.end_timestamp
      );
    });
    if (foundIndex < 0) {
      foundIndex = 0;
    }

    return foundIndex;
  };

  //根据当前时间获取当前节目
  getCurrentProgram = byTime => {
    let foundIndex = byTime
      ? this.getCurrentIndexByTime()
      : this.getCurrentIndexById();
    let currentProgram = this.state.schedule[foundIndex];

    this.setState({
      isPlaying: false,
      currentProgram: currentProgram,
      programReady: true,
      currentProgramIndex: foundIndex
    });
    if (this.state.OS === "iOS") {
      // console.log("iOS");
      if (!this.state.virtualMode) {
        this.playOSVideo(this.state.currentProgram.m3u8_point);
      } else {
        this.playOSVideo(this.state.currentProgram.mp4_url, "video/mp4");
      }
    }
    this.handleNext();
  };
  //比较节目表
  isSameSchedule = (schedule1, schedule2) => {
    if (schedule1.length !== schedule2.length) {
      return false;
    }
    for (let i = 0; i < schedule1.length; i++) {
      if (
        schedule1[i].title !== schedule2[i].title ||
        schedule1[i].start_timestamp !== schedule2[i].start_timestamp ||
        schedule1[i].end_timestamp !== schedule2[i].end_timestamp
      ) {
        return false;
      }
    }
    return true;
  };
  //获取节目表
  getSchedule = (url, byTime) => {
    //console.log("schedule api: ", api);
    fetch(url)
      .then(result => {
        return result.json();
      })
      .then(data => {
        //console.log(data);
        if (data.code === 1) {
          let sameSchedule = this.isSameSchedule(
            this.state.schedule,
            data.data.rows
          );
          // console.log("same schedule: ", sameSchedule);
          if (!sameSchedule && this.mounted) {
            this.setState({
              schedule: data.data.rows
            });

            this.getCurrentProgram(byTime);
          }
        }
      });
  };
  //更新节目表
  checkIfProgramNeedToUpdate = () => {
    if (this.state.virtualMode) {
      return;
    }
    let currentDate = new Date();
    let currentDay = this.calcTime(currentDate.getTime());
    let programEndDate = new Date(
      this.state.currentProgram.end_timestamp * 1000
    );
    let programEndDay = this.calcTime(programEndDate.getTime());

    if (currentDay > programEndDay) {
      let newDate = this.getHKDate();
      this.setState({
        currentDate: newDate
      });
      this.getSchedule(this.state.data.timetable_url, true);
    }
  };
  //处理节目表更新和下个节目自动播放
  handleNext = () => {
    if (this.timer !== null) {
      clearInterval(this.timer);
    }
    if (!this.state.virtualMode) {
      this.timer = setInterval(() => {
        this.checkIfProgramNeedToUpdate();
        this.handleNextProgram();
      }, 30000);
    }
  };
  //屏幕切换
  switchScreen = () => {
    if (isLandscape()) {
      return;
    }

    if (!this.state.fullScreen) {
      $("#adComponent").hide();
      $("#currentVideoInfo").hide();
      $("#videoOuter").addClass("mask-full-screen");
      $("#videoBackground").addClass("background-full-screen");
      $("#playVideo_html5_api").addClass("video-full-screen");
      $("#videoNav").addClass("mask-nav-landscape");
      $("#videoContorl").addClass("mask-control-landscape");
    } else {
      $("#videoOuter").removeClass("mask-full-screen");
      $("#videoBackground").removeClass("background-full-screen");
      $("#playVideo_html5_api").removeClass("video-full-screen");
      $("#videoNav").removeClass("mask-nav-landscape");
      $("#videoContorl").removeClass("mask-control-landscape");
      $("#adComponent").show();
      $("#currentVideoInfo").show();
    }
    let fullScreen = !this.state.fullScreen;

    this.setState({
      fullScreen: fullScreen
    });
  };

  //选择节目
  selectProgram = index => {
    if (index === this.state.selectedProgramIndex) {
      return;
    }
    let currentIndex = this.state.virtualMode
      ? this.getCurrentIndexByTime()
      : this.state.currentProgramIndex;

    if (index >= currentIndex) {
      return;
    } else if (
      this.state.schedule[index].num === "00-000-0000" ||
      this.state.schedule[index].num === "" ||
      this.state.schedule[index].num === undefined ||
      this.state.schedule[index].num === null
    ) {
      return;
    }

    this.setState({
      showModal: true,
      selectedProgramIndex: index
    });
  };
  //关闭对话框
  close = () => {
    this.setState({
      showModal: false,
      selectedProgramIndex: -1
    });
  };
  //确认播放选择的节目
  confirmPlay = () => {
    let selectedIndex = this.state.selectedProgramIndex;
    this.setState({
      currentProgram: this.state.schedule[selectedIndex],
      virtualMode: true,
      isPlaying: false,
      currentProgramIndex: selectedIndex,
      showModal: false,
      needSeek: false,
      videoEnd: false
    });
    clearInterval(this.timer);
    if (this.state.OS !== "iOS") {
      this.playNonOSVideo(this.state.schedule[selectedIndex].mp4_url);
    } else {
      this.playOSVideo(this.state.schedule[selectedIndex].mp4_url, "video/mp4");
    }
  };
  //回到直播
  backToLive = () => {
    let foundIndex = this.getCurrentIndexByTime();
    let currentProgram = this.state.schedule[foundIndex];

    this.setState({
      isPlaying: false,
      currentProgram: currentProgram,
      programReady: true,
      currentProgramIndex: foundIndex,
      virtualMode: false,
      selectedProgramIndex: -1,
      needSeek: true,
      videoEnd: false,
      replay: false
    });
    let url = this.state.data.link[this.state.selectedResolution];
    if (this.state.OS === "iOS") {
      this.playOSVideo(url);
    } else {
      this.playNonOSVideo(url);
    }

    setTimeout(() => {
      this.handleNext();
    }, 3000);
  };
  //设置分辨率
  setResolution = resolution => {
    if (this.state.OS !== "iOS" && this.isWechat()) {
      $("#playVideo_html5_api").show();
    }
    if (
      resolution === this.state.selectedResolution ||
      this.state.virtualMode
    ) {
      return;
    }
    this.setState({
      selectedResolution: resolution,
      isPlaying: false,
      switchResolution: true,
      allowShowResolutionMenu: false
    });
    let url = this.state.data.link[resolution];
    if (this.state.OS === "iOS") {
      this.playOSVideo(url);
    } else {
      this.playNonOSVideo(url);
    }
  };
  //在回放模式下重播已经播完的视频
  replayVideo = () => {
    this.setState({
      needSeek: true,
      videoEnd: false,
      replay: true
    });
    let url = this.state.currentProgram.mp4_url;
    if (this.state.OS === "iOS") {
      this.playOSVideo(url, "video/mp4");
    } else {
      this.playNonOSVideo(url);
    }
  };
  enableMouseDrag = () => {
    let video =
      this.state.OS === "iOS"
        ? document.getElementById("playVideo")
        : document.getElementById("playVideo_html5_api");
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
  //设置时长
  setDuration = () => {
    if (!this.state.virtualMode || !this.mounted) {
      return;
    }
    let duration =
      this.state.OS === "iOS"
        ? document.getElementById("playVideo").duration
        : document.getElementById("playVideo_html5_api").duration;

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
  //更新当前播放时间
  updateTime = () => {
    let current =
      this.state.OS === "iOS"
        ? document.getElementById("playVideo").currentTime
        : document.getElementById("playVideo_html5_api").currentTime;

    if (typeof current === "undefined") {
      return;
    }

    let currentNum = parseInt(current, 10);
    let currentTime = numberToTime(currentNum);
    if (this.mounted) {
      this.setState({
        current: currentNum,
        currentTime: currentTime
      });
    }
  };
  closeAd = () => {
    this.setState({
      showAD: false
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
    if (this.state.OS === "iOS") {
      //let url = this.state.data.link[this.state.selectedResolution];
      this.playOSVideo(this.state.data.link[this.state.selectedResolution]);
    } else {
      this.playNonOSVideo(this.state.data.link[this.state.selectedResolution]);
    }
  };
  handleResolutionMenu = () => {
    let status = !this.state.allowShowResolutionMenu;
    this.setState({
      allowShowResolutionMenu: status
    });
  };
  //判断是否微信浏览器
  /*  isWechat = () => {
    return /micromessenger/.test(navigator.userAgent.toLowerCase());
  };*/
  handleDropdown = showDropDown => {
    if (this.state.OS !== "iOS" && isWechat()) {
      if (showDropDown) {
        $("#playVideo_html5_api").hide();
      } else {
        $("#playVideo_html5_api").show();
      }
    }
  };
  componentDidMount() {
    this.mounted = true;
    const OS = getMobileOperatingSystem();
    fetch(this.props.api, { method: "get" })
      .then(result => {
        return result.json();
      })
      .then(data => {
        // console.log(data);
        if (data.code === 1 && this.mounted) {
          let currentDate = this.getHKDate();

          this.setState({
            data: data.data.rows,
            OS: OS,
            selectedResolution: Object.keys(data.data.rows.default_link)[0],
            currentDate: currentDate,
            fetchSuccess: true
          });
          if (this.state.virtualMode) {
            this.getSchedule(data.data.rows.timetable_url, false);
          } else {
            this.getSchedule(data.data.rows.timetable_url, true);
          }
        }
      });
  }
  componentDidUpdate() {
    let video = null;

    if (document.getElementById("playVideo") !== null) {
      this.setState({
        videoReady: true
      });
    }

    //对非iOS设备进行视频初始化
    if (this.state.OS !== "iOS") {
      if (
        this.state.videoReady &&
        !this.state.isPlaying &&
        this.state.firstLoad &&
        !this.state.nonAppleVideoInitialization
      ) {
        // console.log(this.state);
        video = videojs("playVideo", {
          children: [],
          controls: false,
          autoPlay: true
        });
        //console.log("url: ", this.state.currentProgram.mp4_url);
        if (!this.state.virtualMode) {
          video.src([
            {
              type: "application/vnd.apple.mpegURL",
              src: this.state.data.link[this.state.selectedResolution]
            }
          ]);
        } else if (this.state.currentProgram.mp4_url !== undefined) {
          video.src([
            {
              type: "video/mp4",
              src: this.state.currentProgram.mp4_url
            }
          ]);
        }
        this.setState({
          nonAppleVideoInitialization: true
        });
        video.on("playing", () => {
          this.setState({
            isPlaying: true,
            playing: true,
            firstLoad: false,
            programReady: false
          });
        });
      } else if (this.state.nonAppleVideoInitialization) {
        video = videojs("playVideo");
      }
    } else {
      video = $("#playVideo");
      video.on("play", () => {
        this.setState({
          isPlaying: true,
          playing: true,
          firstLoad: false,
          programReady: false
        });
      });
    }
    if (this.state.videoReady) {
      //监听loadmetadata完成事件，如果完成，设置视频时长
      video.on("loadstart", () => {
        // console.log("load start");
        this.setState({
          loadstarting: true,
          switchResolution: false,
          reloadVideo: false
        });
      });

      video.on("loadedmetadata", () => {
        this.setDuration();
        this.setState({
          videoHeight: video.height()
          // isPlaying: true,
          //playing: true
        });
      });
      video.on("progress", () => {
        if (this.state.loadstarting) {
          this.setState({
            loadstarting: false,
            showBuffer: true
          });
        }
      });

      video.on("canplay", () => {
        this.setState({
          needSeek: false,
          showBuffer: false,
          videoJam: false,
          replay: false,
          isPlaying: true
        });
        if (this.state.OS === "iOS") {
          video.get(0).play();
        } else {
          video.play();
        }
      });
      //监听播放进度事件，更新播放进度
      video.on("timeupdate", this.updateTime);

      // if (this.state.OS === "iOS") {
      video.on("seeking", () => {
        //console.log("seeking");
        if (!this.state.needSeek) {
          this.setState({
            needSeek: true
          });
        }
      });
      video.on("seeked", () => {
        if (this.state.needSeek) {
          // console.log("set seek finish");
          this.setState({
            needSeek: false
          });
        }
      });
      // }

      video.on("ended", () => {
        let landscape = isLandscape() ? true : false;
        this.setState({
          needSeek: false,
          videoEnd: true,
          isPlaying: false,
          landscape: landscape
        });
      });
    }

    let timeDrag = this.state.timeDrag;

    //视频卡顿及处理
    clearInterval(this.isVideoBreak);
    if (
      !this.state.virtualMode &&
      !this.state.showBuffer &&
      this.state.isPlaying
    ) {
      this.isVideoBreak = setInterval(() => {
        let currentTime =
          this.state.OS === "iOS"
            ? video.get(0).currentTime
            : video.currentTime();

        if (currentTime === this.lastTime) {
          //console.log("video chopped");
          this.tryTimes += 1;

          // console.log("try times: ", this.tryTimes);
          if (this.tryTimes > 6) {
            this.setState({
              videoJam: true
            });
            this.tryTimes = 0;
            // console.log("您的网速有点慢，刷新下试试");
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
    clearInterval(this.orientationTimer);
    this.orientationTimer = setInterval(() => {
      let landScape = isLandscape();
      if (landScape !== this.state.landScape) {
        this.setState({
          landScape: landScape
        });
      }
    }, 100);
  }
  componentWillUnmount() {
    this.mounted = false;
    clearInterval(this.orientationTimer);
    clearInterval(this.isVideoBreak);
    clearInterval(this.timer);
    clearTimeout(this.hideMenuTimeout);
    if (this.state.OS !== "iOS") {
      videojs("playVideo").dispose();
    }
  }
  render() {
    //console.log(this.state);
    let videoWidth = window.innerWidth;
    let videoHeight = this.state.isLandScape
      ? window.innerHeight
      : (window.innerWidth * 9) / 16;
    let marginTop =
      this.state.showAD && !this.state.landScape && !this.state.fullScreen
        ? "39px"
        : 0;
    let videoElement;
    if (this.state.OS !== "iOS") {
      videoElement = (
        <video
          id="playVideo"
          autoPlay
          preload="auto"
          poster={posterImg}
          height={videoHeight}
          x5-playsinline="true"
        />
      );
    } else {
      let src, type;
      if (this.state.virtualMode) {
        if (this.state.schedule.length > 0) {
          src = this.state.currentProgram.mp4_url;
          type = "video/mp4";
        }
      } else {
        if (this.state.data !== undefined) {
          src = this.state.data.link[this.state.selectedResolution];
          type = "application/vnd.apple.mpegURL";
        }
      }
      videoElement = (
        <video
          id="playVideo"
          muted
          autoPlay
          preload="metadata"
          poster={posterImg}
          width="auto"
          height={videoHeight}
          webkit-playsinline="true"
          playsInline="true"
        >
          <source src={src} type={type} id="videoSource" />
        </video>
      );
    }
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
        } else if (this.state.switchResolution) {
          message = "正在切换到" + this.state.selectedResolution;
        } else if (this.state.reloadVideo) {
          message = "正在重新加载 ...";
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
      barWidth,
      videoShare,
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
    $el = this.state.OS === "iOS" ? $("#playVideo") : $("#playVideo_html5_api");

    $el.height(videoHeight);

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
      // let videoPosition = $el.position();
      barWidth = $el.width();
      //非全屏状态

      if (!this.state.fullScreen && !this.state.isLandScape) {
        //menuBarYPosition = videoPosition.top;
        menuBarYPosition = 0;
        controlBarYPosition = videoHeight - 50;
      } else if (this.state.fullScreen && !this.state.isLandScape) {
        //全屏状态
        menuBarYPosition = 0;
        controlBarYPosition = 0;
      } else if (!this.state.isLandScape) {
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
            <span
              onClick={e => {
                this.goBack(e);
              }}
              className="video-return-btn"
            >
              <i className="fas fa-chevron-left" style={{ fontSize: "20px" }} />
            </span>

            <span className="nav-title">{this.state.currentProgram.title}</span>
          </div>
        );
      }
      //渲染控制栏

      if (this.state.virtualMode && !this.state.videoEnd) {
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
      } else if (!this.state.virtualMode) {
        if (isLandscape() || this.state.fullScreen) {
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
            id="videoContorl"
            className={controllClass}
            style={{
              marginTop: controlBarYPosition,
              marginLeft: "0"
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
      }
    }
    //视频播放完毕后显示分享界面
    let ad;
    if (this.state.showAD && !this.state.isLandScape && !isLandscape()) {
      ad = <AD closeAd={this.closeAd} />;
    }
    if (this.state.virtualMode && this.state.videoEnd) {
      let url =
        SharePreTxt +
        "/special/live?client=h5&v=" +
        this.props.version +
        "&id=" +
        this.props.id +
        "&special_id=" +
        this.props.specialId +
        "&episode_id=" +
        this.state.currentProgram.episode +
        "&program_id=" +
        this.state.currentProgram.id;
      //console.log("url: ", url);
      let cover = this.state.currentProgram.image_url;
      let shareHeight;
      let shareWidth = window.innerWidth;
      if (this.state.landScape) {
        shareHeight = window.innerHeight;
      } else {
        shareHeight = this.state.height;
      }

      videoShare = (
        <div
          className="video-share"
          style={{
            height: shareHeight,
            backgroundImage: "url(" + cover + ")",
            backgroundSize: shareWidth
          }}
        >
          <div
            onClick={e => {
              this.goBack(e);
            }}
            className="video-share-return-btn"
          >
            <i className="fas fa-chevron-left" />
          </div>

          <div className="video-replay">
            <img src={replayImg} alt="replay" onClick={this.replayVideo} />
            <span onClick={this.replayVideo}>重播</span>
          </div>

          <VideoShare
            url={url}
            title={this.state.currentProgram.title}
            image={this.state.currentProgram.image_url}
            description={this.state.currentProgram.title}
            landscape={this.state.landScape}
          />
        </div>
      );
    }

    //设置声音开启
    if (this.state.muted && this.state.OS === "iOS") {
      volumeHint = (
        <div className="volume-hint">
          <img src={muteImg} alt="muted" />
          <span id="muteTxt">点击取消静音</span>
        </div>
      );
    } else {
      volumeHint = null;
    }

    //设置分辨率选择项
    let resolution;
    if (this.state.data !== undefined) {
      let keys = [];
      for (let key in this.state.data.link) {
        keys.push(key);
      }

      if (!this.state.virtualMode && !this.state.fullScreen) {
        if (!isLandscape()) {
          resolution = (
            <div className="resolution-setting">
              <DropDown
                list={keys}
                defaultItem={this.state.selectedResolution}
                setItem={this.setResolution}
                handleDropdown={this.handleDropdown}
              />
              可選擇畫質
            </div>
          );
        }

        if (isLandscape() && this.state.allowShowResolutionMenu) {
          let rightPos = window.innerWidth * 0.03 + 24;
          let height = 35 * keys.length;
          resolutionListLandscape = (
            <div
              className="resolution-list-landscape"
              style={{ right: rightPos, height: height }}
            >
              <ul>
                {keys.map((item, index) => {
                  let itemColor =
                    item === this.state.selectedResolution ? "#fd7d02" : "#fff";
                  return (
                    <li
                      style={{ color: itemColor }}
                      onClick={() => {
                        this.setResolution(item);
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
      }
    }

    //节目栏
    let programList;

    programList = this.state.schedule.map((item, index) => {
      let currentIndex = this.state.virtualMode
        ? this.getCurrentIndexByTime()
        : this.state.currentProgramIndex;
      let stindex = item.starttime.indexOf(" ");
      let time = item.starttime.substr(stindex, 6);
      //在当前播放的节目中显示播放图标
      let playIcon =
        index === this.state.currentProgramIndex ? (
          <img src={smallPlayIcon} alt="播放" />
        ) : null;
      //显示节目文字颜色
      let txtColor;

      if (index === this.state.currentProgramIndex) {
        txtColor = "#ff4040";
      } else if (index < currentIndex) {
        txtColor = "black";
      } else if (index > currentIndex) {
        txtColor = "grey";
      }
      //显示节目文字
      let programTxt;
      if (item.title.length > 16) {
        let endTxt = item.title.substr(item.title.length - 6, 6);
        let frontTxt = item.title.substr(0, 6);
        let txt = frontTxt + "..." + endTxt;
        programTxt = (
          <td style={{ width: "65%", textAlign: "left", paddingLeft: "20px" }}>
            {txt}
          </td>
        );
      } else {
        programTxt = (
          <td style={{ width: "65%", textAlign: "left", paddingLeft: "20px" }}>
            {item.title}
          </td>
        );
      }
      return (
        <tr
          key={index}
          style={{ color: txtColor }}
          onClick={() => {
            this.selectProgram(index);
          }}
        >
          <td style={{ width: "5%" }}>{playIcon}</td>
          <td style={{ width: "20%" }}>{time}</td>
          <td style={{ width: "10%" }}>{item.type}</td>
          {programTxt}
        </tr>
      );
    });

    let timeStand =
      this.state.schedule.length > 0 ? "以上均為北京時間" : "目前暫無節目表";
    let program = (
      <div className="current-program">
        <table>
          <thead>
            <tr>
              <td style={{ width: "5%" }} />
              <td style={{ width: "20%" }}>時間</td>
              <td style={{ width: "10%" }}>類型</td>
              <td style={{ width: "65%" }}>節目名稱</td>
            </tr>
          </thead>
          <tbody>{programList}</tbody>
        </table>
        <p className="region-time">{timeStand}</p>
      </div>
    );

    //定义对话框
    let dialogBox;
    if (this.state.showModal) {
      let selectedProgram = this.state.schedule[
        this.state.selectedProgramIndex
      ];
      dialogBox = (
        <Modal
          action="是否播放"
          title={selectedProgram.title}
          close={this.close}
          confirm={this.confirmPlay}
          no="关闭"
          yes="播放"
        />
      );
    } else {
      dialogBox = null;
    }
    //显示直播/回放栏
    let virtualLive;
    if (!this.state.virtualMode && this.state.fetchSuccess) {
      virtualLive = (
        <div className="special-live-title">{this.state.data.live_status}</div>
      );
    } else {
      virtualLive = (
        <div className="special-live-title">
          <span
            className="virtual-play"
            onClick={() => {
              this.backToLive();
            }}
          >
            回到直播
          </span>
        </div>
      );
    }
    //显示时间
    let liveDateTxt = this.state.fetchSuccess ? this.state.data.date_cn : "";
    let liveDate = <div className="special-live-date">{liveDateTxt}</div>;
    let resolutionHeight = "80px";
    if (this.state.virtualMode || this.state.isLandScape) {
      resolutionHeight = "0";
    }

    return (
      <div className="video-wrapper">
        {ad}
        <div
          id="videoOuter"
          style={{ height: videoHeight, marginTop: marginTop }}
          className="mask"
          onClick={() => {
            this.showMenu();
          }}
        >
          {menuBar}
          {volumeHint}
          {loading}
          {resolutionListLandscape}
          {videoShare}
          {controlBar}
        </div>
        <div
          id="videoBackground"
          className="video-background"
          style={{
            height: videoHeight
          }}
        >
          <div
            style={{
              width: videoWidth,
              height: videoHeight,
              margin: "0 auto"
            }}
          >
            {videoElement}
          </div>
        </div>
        <div
          className="resolution-selection"
          style={{ height: resolutionHeight }}
        >
          {resolution}
        </div>
        <div id="currentVideoInfo">
          <div className="special-program-item clearfix">
            {virtualLive}
            {liveDate}
            <div className="special-program-btn">節目表</div>
          </div>
          {program}
        </div>
        {dialogBox}
      </div>
    );
  }
}
export default SpecialLive;
