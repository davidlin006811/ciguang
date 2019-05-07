import React, { PureComponent } from "react";
import qs from "qs";
import { liveAPI, ServerTimeAPI } from "../commonConst";
import { isLandscape } from "../commonFunctions";
import Modal from "../modal/modal";
import $ from "jquery";
import AD from "../ad/ad";
import VideoPlayer from "../videoPlayer/videoPlayer";
import "../component.css";
import "../videos/video/video.css";
import "./live.css";
import menuImg from "../image/menu.svg";
import playImg from "../image/play_icon.svg";
import closeImg from "../image/close.svg";

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
      programReady: false, //节目是否准备好
      virtualMode: false, //定义是否强制轮播模式
      currentProgramIndex: 0, //定义当前节目索引
      showModal: false, //定义是否显示对话框
      selectedProgramIndex: -1, //定义选择的节目索引
      showAD: showAD,
      videoEnd: false
    };
    this.mounted = false;
  }
  //返回上级菜单
  goBack = currentTime => {
    this.props.history.goBack();
  };
  //屏幕切换
  fullScreen = () => {
    if (this.state.showAd) {
      $("#adComponent").hide();
    }
    $("#currentVideoInfo").hide();
  };
  normalScreen = () => {
    if (this.state.showAd) {
      $("#adComponent").show();
    }
    $("#currentVideoInfo").show();
  };
  //视频结束
  videoEnd = () => {
    if (!this.state.virtualMode) {
      this.setState({
        videoEnd: true
      });
    }
  };
  closeAd = () => {
    this.setState({
      showAD: false
    });
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
        currentProgramIndex: nextIndex,
        videoEnd: false
      });
    }
  };

  //获取当前时间在节目中的索引
  getCurrentIndex = () => {
    let currentTimeStamp = new Date().getTime() / 1000;
    let foundProgram = true;
    // console.log("current timestamp: ", currentTimeStamp);
    let foundIndex = this.state.schedule.findIndex(x => {
      return (
        currentTimeStamp >= x.start_timestamp &&
        currentTimeStamp < x.end_timestamp
      );
    });
    //如果找不到相应的节目，查找最近的一个
    if (foundIndex < 0) {
      foundProgram = false;
      foundIndex = 0;
      for (let i = 0; i < this.state.schedule.length; i++) {
        let item = this.state.schedule[i];
        if (item.start_timestamp > currentTimeStamp) {
          foundIndex++;
        }
      }
    }
    return { foundProgram: foundProgram, foundIndex: foundIndex };
  };

  //根据当前时间获取当前节目
  getCurrentProgram = () => {
    let currentTimeStamp = new Date().getTime() / 1000;
    let result = this.getCurrentIndex();
    let foundIndex = result.foundIndex;
    let foundProgram = result.foundProgram;
    let currentProgram = this.state.schedule[foundIndex];
    let currentTime = foundProgram
      ? currentTimeStamp - currentProgram.start_timestamp
      : 0;
    this.setState({
      isPlaying: false,
      currentProgram: currentProgram,
      programReady: true,
      currentProgramIndex: foundIndex,
      foundProgram: foundProgram,
      currentTime: currentTime
    });

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

    if (currentDay > programEndDay) {
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
      //isPlaying: false,
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

  //选择节目
  selectProgram = index => {
    if (index === this.state.selectedProgramIndex) {
      return;
    }
    let currentIndex = this.state.virtualMode
      ? this.getCurrentIndex().foundIndex
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
  };
  //回到直播
  backToLive = () => {
    let result = this.getCurrentIndex();
    let foundIndex = result.foundIndex;
    let currentProgram = this.state.schedule[foundIndex];

    this.setState({
      isPlaying: false,
      currentProgram: currentProgram,
      programReady: true,
      currentProgramIndex: foundIndex,
      virtualMode: false,
      selectedProgramIndex: -1
    });

    this.handleNext();
  };

  componentDidMount() {
    // this.getServerTime();
    this.mounted = true;
    //const OS = getMobileOperatingSystem();
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
              selectedChannelId: selectedChannelId
              // OS: OS
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

  componentWillUnmount() {
    this.mounted = false;
    clearInterval(this.timer);
  }
  render() {
    console.log(this.state);
    let title =
      this.state.videoEnd || !this.state.foundProgram
        ? "休息時間"
        : this.state.currentProgram.title;
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
          <span>{title}</span>
          <span style={{ paddingLeft: "85%" }}>{title}</span>
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
          ? this.getCurrentIndex().foundIndex
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
    let virtualMode =
      this.state.selectedLive.type !== "live" ||
      this.state.virtualMode ||
      this.state.currentProgram.channel_type === "virtual"
        ? true
        : false;
    let repeat = this.state.virtualMode ? true : false;
    //console.log("virtual mode: ", virtualMode);
    let url = virtualMode
      ? this.state.currentProgram.mp4_url
      : this.state.currentProgram.m3u8_point;
    if (this.state.selectedLive.cut_url) {
      url =
        this.state.videoEnd || !this.state.foundProgram
          ? this.state.selectedLive.cut_url.replace(
              new RegExp("http", "g"),
              "https"
            )
          : url;
    }
    let vPlayer;
    if (url) {
      let lastPlayTime =
        this.state.currentProgram.channel_type === "live"
          ? 0
          : this.state.currentTime;
      const info = {
        title: title,
        url: url,
        poster: this.state.currentProgram.image_url,
        virtualMode: virtualMode,
        lastPlayTime: lastPlayTime,
        repeat: repeat,
        hideControl: true,
        videoEnd: this.videoEnd,
        goBack: this.goBack,
        fullScreen: this.fullScreen,
        normalScreen: this.normalScreen
      };
      vPlayer = <VideoPlayer {...info} />;
    }

    return (
      <div className="video-wrapper">
        {ad}
        {vPlayer}

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
