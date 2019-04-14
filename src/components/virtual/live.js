import React, { PureComponent } from "react";
import qs from "qs";
import { liveAPI, ServerTimeAPI } from "../commonConst";
import { getMobileOperatingSystem, isLandscape } from "../commonFunctions";
import Modal from "../modal/modal";
import $ from "jquery";
import videojs from "video.js";
import AD from "../ad/ad";
import "../component.css";
import "../videos/video/video.css";
import "./live.css";
import fullScreenImg from "../image/full_screen.svg";
import normalScreenImg from "../image/normal_screen.svg";
import loadingImg from "../image/loading.gif";
import menuImg from "../image/menu.svg";
import playImg from "../image/play_icon.svg";
import closeImg from "../image/close.svg";
import muteImg from "../image/mute.svg";
import posterImg from "../image/video_poster.jpg";

class Live extends PureComponent {
  constructor(props) {
    super(props);
    this.timer = null;
    this.checkOrientation = null;
    this.hideMenuTimeout = null;
    let selectedChannelId = -1;
    let showAD = true;
    if (props.match.path === "/cat/live/:id") {
      let qsString = qs.parse(props.location.search.slice(1));
      if (qsString.itemid !== null) {
        selectedChannelId = parseInt(qsString.itemid, 10) + 1;
      }
      if (qsString.hint !== null && qsString.hint === "0") {
        showAD = false;
      }
    }
    this.state = {
      list: [], //频道列表
      selectedChannelId: selectedChannelId, //所选的频到id
      selectedLive: {}, //所选的当前直播
      schedule: [], //所选直播的节目表
      currentProgram: {}, //当前的节目
      localTime: {}, //现在的当地时间
      programMode: false, //节目表和频道的切换
      enableLive: true, //允许直播
      videoReady: false, //视频准备
      isPlaying: false, //是否正在播放
      fullScreen: false, //是否全屏
      programReady: false, //节目是否准备好
      firstLoad: true, //是否第一次加载视频
      muted: true, //是否静音
      allowShowMenu: false,
      virtualMode: false, //定义是否强制轮播模式
      currentProgramIndex: 0, //定义当前节目索引
      showModal: false, //定义是否显示对话框
      selectedProgramIndex: -1, //定义选择的节目索引
      OS: null, //定义操作平台
      needSeek: true,
      isLandScape: isLandscape(),
      showAD: showAD
    };
    this.mounted = false;
  }
  //返回上级菜单
  goBack = e => {
    this.props.history.goBack();
  };
  turnOnVolume = () => {
    if (this.state.muted) {
      document.getElementById("playVideo").muted = false;
      // let video = videojs("currentVideo");
      //video.muted(false);
      this.setState({
        muted: false
      });
    }
  };
  showMenu = () => {
    this.turnOnVolume();
    let menuBar = $("#videoNav");
    let controllBar = $("#videoControl");
    $("#videoNav").fadeIn();
    $("#videoControl").fadeIn();
    let delayTime = isLandscape() ? 60000 : 10000;
    clearTimeout(this.hideMenuTimeout);
    this.hideMenuTimeout = setTimeout(() => {
      menuBar.fadeOut();
      controllBar.fadeOut();
    }, delayTime);
  };
  closeAd = () => {
    this.setState({
      showAD: false
    });
  };
  //判读是否横屏
  isLandscape = () => {
    return window.orientation === 90 || window.orientation === -90;
  };
  //列表/频道切换
  switchMode = e => {
    e.preventDefault();
    if (this.state.currentProgram.id !== null) {
      let mode = !this.state.programMode;
      this.setState({
        programMode: mode
      });
    }
  };
  calcTime = timestamp => {
    // create Date object for current location
    let d = new Date(timestamp);
    let utc = d.getTime() + d.getTimezoneOffset() * 60000;

    let nd = new Date(utc + 3600000 * 8);
    //console.log("time date: ", nd);
    // return time as a string
    return nd.getDate();
  };

  getVideoCurrentTime = () => {
    let d = new Date();
    let currentTime = d.getTime() / 1000;
    if (currentTime < this.state.currentProgram.end_timestamp) {
      return currentTime - this.state.currentProgram.start_timestamp;
    } else {
      return -1;
    }
  };
  //在OS系统下播放视频
  playOSVideo = url => {
    let video = $("#playVideo");
    if (typeof video === undefined) {
      return;
    }
    video.get(0).pause();
    let source = video.find("#videoSource");
    source.attr("src", url);
    video.get(0).load();
  };
  //在非OS系统下播放视频
  playNonOSVideo = url => {
    let player = videojs("playVideo");
    player.pause();
    player.src(url);
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
        if (this.state.selectedLive.type !== "live" || this.state.virtualMode) {
          this.playNonOSVideo(this.state.currentProgram.mp4_url);
        }
      } else {
        if (this.state.selectedLive.type !== "live" || this.state.virtualMode) {
          this.playOSVideo(this.state.currentProgram.mp4_url);
        }
      }
    }
  };

  //获取当前时间在节目中的索引
  getCurrentIndex = () => {
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
  getCurrentProgram = () => {
    let foundIndex = this.getCurrentIndex();
    let currentProgram = this.state.schedule[foundIndex];

    this.setState({
      isPlaying: false,
      currentProgram: currentProgram,
      programReady: true,
      currentProgramIndex: foundIndex
    });
    if (this.state.OS === "iOS") {
      // console.log("iOS");
      if (this.state.selectedLive.type === "live") {
        this.playOSVideo(this.state.currentProgram.m3u8_point);
      } else {
        this.playOSVideo(this.state.currentProgram.mp4_url);
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
  getSchedule = (api, channelId) => {
    //console.log("schedule api: ", api);
    fetch(api)
      .then(result => {
        return result.json();
      })
      .then(data => {
        if (data.code === 1) {
          let sameSchedule = this.isSameSchedule(
            this.state.schedule,
            data.data.rows
          );
          // console.log("same schedule: ", sameSchedule);
          if (!sameSchedule && channelId === this.state.selectedChannelId) {
            this.setState({
              schedule: data.data.rows
            });
            this.getCurrentProgram();
          }
          sessionStorage.setItem(
            "liveChannel-" + channelId,
            JSON.stringify(data.data.rows)
          );
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
    //console.log("current Date: ", currentDay);
    // console.log("program Date: ", programEndDay);
    if (currentDay > programEndDay) {
      //console.log("need update ")
      this.getSchedule(
        this.state.selectedLive.scedule_url,
        this.state.selectedChannelId
      );
    }
  };
  //处理节目表更新和下个节目自动播放
  handleNext = () => {
    if (this.timer !== null) {
      clearInterval(this.timer);
    }
    this.timer = setInterval(() => {
      this.checkIfProgramNeedToUpdate();
      this.handleNextProgram();
    }, 30000);
  };
  //获取所选的直播
  getSelectedLive = id => {
    let foundIndex = this.state.list.findIndex(x => {
      return x.channel_id === id;
    });
    if (foundIndex >= 0) {
      localStorage.setItem("selectedLiveChannelId", JSON.stringify(id));
      return this.state.list[foundIndex];
    } else {
      return null;
    }
  };
  //获取当地服务器时间
  getServerTime = () => {
    fetch(ServerTimeAPI)
      .then(result => {
        return result.json();
      })
      .then(data => {
        if (data.code === 1) {
          this.setState({
            localTime: data.data
          });
        }
      });
  };

  //选择频道
  switchChannel = id => {
    if (id === this.state.selectedChannelId) {
      return;
    }
    let index = this.state.list.findIndex(x => {
      return x.channel_id === id;
    });
    this.setState({
      selectedLive: this.state.list[index],
      selectedChannelId: id,
      selectedProgramIndex: -1,
      isPlaying: false,
      virtualMode: false,
      needSeek: true
    });
    let storageSchedule = sessionStorage.getItem("liveChannel-" + id);
    if (storageSchedule !== null) {
      //console.log("schedule found!");
      let schedule = JSON.parse(storageSchedule);
      this.setState({
        schedule: schedule
      });
      setTimeout(() => {
        this.getCurrentProgram();
      }, 300);
    } else {
      this.getSchedule(this.state.list[index].scedule_url, id);
    }

    localStorage.setItem("selectedLiveChannelId", JSON.stringify(id));
  };

  //屏幕切换
  switchScreen = () => {
    if (isLandscape()) {
      return;
    }

    if (!this.state.fullScreen) {
      $("#currentVideoInfo").hide();
      $("#adComponent").hide();
      $("#videoOuter").addClass("mask-full-screen");
      $("#videoBackground").addClass("background-full-screen");
      $("#playVideo_html5_api").addClass("video-full-screen");
      $("#videoNav").addClass("mask-nav-landscape");
      $("#videoControl").addClass("mask-control-landscape");
    } else {
      $("#videoOuter").removeClass("mask-full-screen");
      $("#videoBackground").removeClass("background-full-screen");
      $("#playVideo_html5_api").removeClass("video-full-screen");
      $("#videoNav").removeClass("mask-nav-landscape");
      $("#videoControl").removeClass("mask-control-landscape");
      $("#currentVideoInfo").show();
      $("#adComponent").show();
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
      ? this.getCurrentIndex()
      : this.state.currentProgramIndex;

    if (index >= currentIndex) {
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
      needSeek: false
    });
    clearInterval(this.timer);
    if (this.state.OS !== "iOS") {
      this.playNonOSVideo(this.state.schedule[selectedIndex].mp4_url);
    } else {
      this.playOSVideo(this.state.schedule[selectedIndex].mp4_url);
    }
  };
  //回到直播
  backToLive = () => {
    let foundIndex = this.getCurrentIndex();
    let currentProgram = this.state.schedule[foundIndex];

    this.setState({
      isPlaying: false,
      currentProgram: currentProgram,
      programReady: true,
      currentProgramIndex: foundIndex,
      virtualMode: false,
      selectedProgramIndex: -1,
      needSeek: true
    });
    if (this.state.OS === "iOS") {
      let url =
        this.state.selectedLive.type === "live"
          ? currentProgram.m3u8_point
          : currentProgram.mp4_url;

      this.playOSVideo(url);
    }
    this.handleNext();
  };

  componentDidMount() {
    // this.getServerTime();
    this.mounted = true;
    const OS = getMobileOperatingSystem();
    //console.log("os: ", OS);
    let selectedChannelId = this.state.selectedChannelId;
    if (selectedChannelId < 0) {
      let id = localStorage.getItem("selectedLiveChannelId");
      if (id !== null) {
        selectedChannelId = JSON.parse(id);
      } else {
        selectedChannelId = 1;
      }
    }

    fetch(liveAPI, { method: "get" })
      .then(result => {
        return result.json();
      })
      .then(data => {
        //console.log(data);
        if (data.code === 1) {
          let foundIndex = data.data.rows.findIndex(x => {
            return x.channel_id === selectedChannelId;
          });
          if (this.mounted) {
            this.setState({
              list: data.data.rows,
              selectedLive: data.data.rows[foundIndex],
              selectedChannelId: selectedChannelId,
              OS: OS
            });
            this.getSchedule(
              data.data.rows[foundIndex].scedule_url,
              selectedChannelId
            );

            localStorage.setItem(
              "selectedLiveChannelId",
              JSON.stringify(selectedChannelId)
            );
            for (let i = 0; i < data.data.rows.length; i++) {
              let channel = data.data.rows[i];
              if (channel.channel_id !== selectedChannelId) {
                this.getSchedule(channel.scedule_url, channel.channel_id);
              }
            }
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
    if (this.state.OS !== "iOS") {
      if (
        this.state.videoReady &&
        !this.state.isPlaying &&
        this.state.programReady &&
        this.state.firstLoad
      ) {
        video = videojs("playVideo", {
          children: [],
          controls: false,
          autoPlay: true
        });
        // console.log("video init");
      } else if (!this.state.firstLoad && this.state.programReady) {
        video = videojs("playVideo");
        //console.log("video 2");
      }
      if (video !== null) {
        if (this.state.selectedLive.type === "live") {
          video.src([
            {
              type: "application/vnd.apple.mpegURL",
              src: this.state.currentProgram.m3u8_point
            }
          ]);
        } else {
          video.src([
            {
              type: "video/mp4",
              src: this.state.currentProgram.mp4_url
            }
          ]);
        }
        video.on("loadedmetadata", () => {
          if (
            !this.state.virtualMode &&
            this.state.selectedLive.type !== "live" &&
            this.state.needSeek
          ) {
            let videoCurrentTime = this.getVideoCurrentTime();
            let videoDuration = video.duration();

            let offSetTime =
              videoCurrentTime > videoDuration
                ? videoDuration
                : videoCurrentTime;
            video.currentTime(offSetTime);
          }
        });
        video.play();
        video.on("playing", () => {
          this.setState({
            isPlaying: true,
            firstLoad: false,
            programReady: false,
            needSeek: false
          });
        });
        video.on("ended", () => {
          this.setState({
            needSeek: false
          });
          video.pause();

          if (!this.state.virtualMode) {
            video.src(this.state.selectedLive.cut_url);
          } else {
            video.src(this.state.currentProgram.mp4_url);
          }
          video.load();
          video.play();
        });
      }
    } else {
      video = $("#playVideo");

      //如果视频加载完成，移除等待画面
      video.on("canplay", () => {
        if (
          video.find("#videoSource").attr("src") !==
          this.state.selectedLive.cut_url
        ) {
          if (
            !this.state.virtualMode &&
            this.state.selectedLive.type !== "live" &&
            this.state.needSeek
          ) {
            let videoCurrentTime = this.getVideoCurrentTime();
            let videoDuration = video.get(0).duration;

            let offsetTime =
              videoCurrentTime < videoDuration
                ? videoCurrentTime
                : videoDuration - 0.01;
            video.get(0).currentTime = offsetTime;
          }
        } else {
          video.get(0).currentTime = 0;
        }

        video.get(0).play();
      });
      video.on("play", () => {
        this.setState({
          isPlaying: true,
          firstLoad: false,
          programReady: false,
          needSeek: false
        });
      });
      video.on("ended", () => {
        this.setState({
          needSeek: false
        });
        video.get(0).pause();
        let url = !this.state.virtualMode
          ? this.state.selectedLive.cut_url
          : this.state.currentProgram.mp4_url;

        let source = video.find("#videoSource");
        source.attr("src", url);
        video.get(0).load();
        //video.get(0).play();
      });
    }
    clearInterval(this.checkOrientation);
    this.checkOrientation = setInterval(() => {
      let islandscape = isLandscape();
      if (islandscape !== this.state.isLandScape) {
        this.setState({
          isLandScape: islandscape
        });
      }
    }, 100);
  }
  componentWillUnmount() {
    this.mounted = false;
    clearInterval(this.timer);
    clearInterval(this.checkOrientation);
    clearTimeout(this.hideMenuTimeout);
    videojs("playVideo").dispose();
  }
  render() {
    //console.log(this.state);
    let videoWidth = window.innerWidth;
    let videoElement;
    let videoHeight = this.state.isLandScape
      ? window.innerHeight
      : (window.innerWidth * 9) / 16;
    let marginTop =
      this.state.showAD && !this.state.isLandScape && !this.state.fullScreen
        ? "39px"
        : 0;
    if (this.state.OS !== "iOS") {
      videoElement = (
        <video
          id="playVideo"
          autoPlay
          preload="auto"
          x5-playsinline="true"
          poster={posterImg}
          height={videoHeight}
        />
      );
    } else {
      let src =
        this.state.selectedLive.type === "live" && !this.state.virtualMode
          ? this.state.currentProgram.m3u8_point
          : this.state.currentProgram.mp4_url;
      //console.log("src: ", src);
      let type =
        this.state.selectedLive.type === "live" && !this.state.virtualMode
          ? "application/vnd.apple.mpegURL"
          : "video/mp4";
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
          playsInline={true}
        >
          <source src={src} type={type} id="videoSource" />
        </video>
      );
    }

    //视频标题栏

    let videoTitle = (
      <div className="current-program-title">
        <marquee
          behavior="scroll"
          direction="left"
          loop="infinite"
          scrollamount="2"
          scrolldelay="30"
        >
          <span>{this.state.currentProgram.title}</span>
          <span style={{ paddingLeft: "85%" }}>
            {this.state.currentProgram.title}
          </span>
        </marquee>
      </div>
    );

    //频道列表栏

    let program;
    let channelList = this.state.list.map((item, index) => {
      let ikey = item.channel_id + index;
      let channelYPos = "y-top";
      if (index > 2 && index <= 5) {
        channelYPos = "y-middle";
      } else if (index > 5) {
        channelYPos = "y-bottom";
      }
      let channelXPos = "x-middle";
      if (index % 3 === 0) {
        channelXPos = "x-left";
      } else if ((index + 1) % 3 === 0) {
        channelXPos = "x-right";
      }
      let selectedClass =
        item.channel_id === this.state.selectedChannelId
          ? "active-channel"
          : "";
      let channelClass =
        "channel-list-item" +
        " " +
        channelXPos +
        " " +
        channelYPos +
        " " +
        selectedClass;
      return (
        <div
          className={channelClass}
          key={ikey}
          onClick={() => {
            this.switchChannel(item.channel_id);
          }}
        >
          <img src={item.channel_logo} alt="分类图片" />
          <p>{item.title}</p>
        </div>
      );
    });

    if (this.state.programMode === false) {
      program = <div className="channel-list">{channelList}</div>;
    } else {
      let programList = this.state.schedule.map((item, index) => {
        let currentIndex = this.state.virtualMode
          ? this.getCurrentIndex()
          : this.state.currentProgramIndex;
        let stindex = item.starttime.indexOf(" ");
        let time = item.starttime.substr(stindex, 6);
        //在当前播放的节目中显示播放图标
        let playIcon =
          index === this.state.currentProgramIndex ? (
            <img src={playImg} alt="播放" />
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
            <td
              style={{ width: "65%", textAlign: "left", paddingLeft: "20px" }}
            >
              {txt}
            </td>
          );
        } else {
          programTxt = (
            <td
              style={{ width: "65%", textAlign: "left", paddingLeft: "20px" }}
            >
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
      program = (
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
          <p className="region-time">以上均為北京時間</p>
        </div>
      );
    }
    let buttonImg = this.state.programMode ? closeImg : menuImg;

    //设置视频等待画面

    let loading;
    if (!this.state.isPlaying) {
      //视频没有准备好时显示载入画面
      loading = (
        <div
          className="video-loading"
          style={{ height: "100%", width: "100%" }}
        >
          <img src={loadingImg} alt="loading" style={{ width: "40px" }} />
        </div>
      );
    } else {
      loading = null;
    }
    let videoElem = $("video");
    let actualWidth = videoWidth;

    if (videoElem[0] !== undefined) {
      if (videoElem[0].videoWidth > 0 && this.state.isPlaying) {
        let width = videoElem[0].videoWidth;
        let height = videoElem[0].videoHeight;
        actualWidth = width * (videoHeight / height);
      }
    }
    //console.log("actual width: ", actualWidth);
    /* 菜单栏及控制栏  */
    let screenIcon,
      volumeHint,
      menuBar,
      controlBar,
      menuBarYPosition,
      controlBarYPosition,
      resolutionMenu;
    let menuClass = "video-menu-nav";
    let controllClass = "video-control-bar";
    if (!this.state.allowShowMenu) {
      menuClass += " hide";
      controllClass += " hide";
    }

    if (this.state.isPlaying) {
      let $el =
        this.state.OS === "iOS" ? $("#playVideo") : $("#playVideo_html5_api");
      $el.height(videoHeight);
      //设置全屏/非全屏图标
      if (this.state.fullScreen) {
        screenIcon = normalScreenImg;
      } else {
        screenIcon = fullScreenImg;
      }
      //设置菜单栏和控制栏的位置
      //let videoPosition = $el.position();
      //非全屏状态
      //console.log("video position: ", videoPosition);
      if (!this.state.fullScreen && !isLandscape()) {
        menuBarYPosition = 0;
        controlBarYPosition = $el.height() - 50;
      } else if (this.state.fullScreen && !isLandscape()) {
        //全屏状态
        menuBarYPosition = 0;
        controlBarYPosition = 0;
      } else if (isLandscape()) {
        //横屏状态
        menuBarYPosition = 0;
        controlBarYPosition = window.innerHeight - 50;
      }
      //菜单栏
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
            <i className="iconfont" style={{ fontSize: "20px" }}>
              &#xe66f;
            </i>
          </span>

          <span className="nav-title">{this.state.currentProgram.title}</span>
        </div>
      );

      //渲染控制栏
      controlBar = (
        <div
          id="videoControl"
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
            <img src={screenIcon} alt="screen-icon" />
          </div>
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
    if (!this.state.virtualMode) {
      virtualLive = <div className="live-title">直播中</div>;
    } else {
      virtualLive = (
        <div className="live-title">
          回放中
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
    let ad;
    if (this.state.showAD && !isLandscape()) {
      ad = <AD closeAd={this.closeAd} />;
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
          {resolutionMenu}
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
              width: actualWidth,
              height: videoHeight,
              margin: "0 auto"
            }}
          >
            {videoElement}
          </div>
        </div>

        <div id="currentVideoInfo">
          {videoTitle}
          <div className="program-item clearfix">
            {virtualLive}
            <div
              className="program-btn"
              onClick={e => {
                this.switchMode(e);
              }}
            >
              <span className="program-button">
                節目表
                <img src={buttonImg} alt="节目表" />
              </span>
            </div>
          </div>
          {program}
        </div>
        {dialogBox}
      </div>
    );
  }
}
export default Live;
