import React, { PureComponent } from "react";
import {
  getMobileOperatingSystem,
  isLandscape,
  isWechat
} from "../../../commonFunctions";
import $ from "jquery";
import Modal from "../../../modal/modal";
import DropDown from "../../../dropdown/dropdown";
import AD from "../../../ad/ad";
import VideoPlayer from "../../../videoPlayer/videoPlayer";
import "../../../component.css";
import "../../../videos/video/video.css";
import "../../../virtual/live.css";
import "./specialLive.css";

import smallPlayIcon from "../../../image/play_icon.svg";

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
      virtualMode: virtualMode, //定义是否强制轮播模式
      currentProgramIndex: 0, //定义当前节目索引
      showModal: false, //定义是否显示对话框
      selectedProgramIndex: -1, //定义选择的节目索引
      videoEnd: false, //在回放模式下视频是否播完
      currentDate: "",
      showAD: this.props.showAD,
      fetchSuccess: false,
      allowShowResolutionMenu: false
    };
    this.lastTime = -1;
    //this.tryTimes = 0;
    this.timer = null;
    this.hideMenuTimeout = null;
    //this.isVideoBreak = null;
    this.orientationTimer = null;
    this.mounted = false;
  }
  //返回上级菜单
  goBack = e => {
    this.props.goBack();
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
      //programReady: true,
      currentProgramIndex: foundIndex
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
  fullScreen = () => {
    if (this.state.showAd) {
      $("#adComponent").hide();
    }
    $("#currentVideoInfo").hide();
    this.setState({
      fullScreen: true
    });
  };
  normalScreen = () => {
    if (this.state.showAd) {
      $("#adComponent").show();
    }
    $("#currentVideoInfo").show();
    this.setState({
      fullScreen: false
    });
  };
  //视频结束
  videoEnd = () => {
    if (!this.state.virtualMode) {
      this.setState({
        videoEnd: true
      });
    }
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
      // isPlaying: false,
      currentProgramIndex: selectedIndex,
      showModal: false,
      //needSeek: false,
      videoEnd: false
    });
    clearInterval(this.timer);
  };
  //回到直播
  backToLive = () => {
    let foundIndex = this.getCurrentIndexByTime();
    let currentProgram = this.state.schedule[foundIndex];

    this.setState({
      currentProgram: currentProgram,
      currentProgramIndex: foundIndex,
      virtualMode: false,
      selectedProgramIndex: -1,
      videoEnd: false
    });

    setTimeout(() => {
      this.handleNext();
    }, 3000);
  };
  //设置分辨率
  setResolution = resolution => {
    if (
      resolution === this.state.selectedResolution ||
      this.state.virtualMode
    ) {
      return;
    }

    this.setState({
      selectedResolution: resolution,
      switchResolution: true,
      allowShowResolutionMenu: false,
      showDropDown: false
    });
  };

  setRes = resolution => {
    this.setResolution(resolution);
  };

  closeAd = () => {
    this.setState({
      showAD: false
    });
  };

  handleDropdown = showDropDown => {
    if (this.state.OS !== "iOS" && isWechat()) {
      if (showDropDown) {
        this.setState({
          showDropDown: true
        });
      } else {
        this.setState({
          showDropDown: false
        });
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
  }
  render() {
    //设置分辨率选择项
    console.log(this.state);
    let resolution;
    let keys = [];
    if (this.state.data !== undefined) {
      for (let key in this.state.data.link) {
        keys.push(key);
      }

      if (!this.state.virtualMode && !this.state.fullScreen) {
        if (!this.state.landScape) {
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
    //视频播放完毕后显示分享界面
    let ad;
    if (this.state.showAD && !this.state.isLandScape && !isLandscape()) {
      ad = <AD closeAd={this.closeAd} />;
    }
    let player;
    if (this.state.fetchSuccess) {
      let url = this.state.virtualMode
        ? this.state.currentProgram.mp4_url
        : this.state.data.link[this.state.selectedResolution];
      let title = this.state.currentProgram.title
        ? this.state.currentProgram.title
        : this.state.data.title;
      const info = {
        title: title,
        url: url,
        poster: this.state.currentProgram.image_url,
        virtualMode: this.state.virtualMode,
        showDropDown: this.state.showDropDown,
        selectedResolution: this.state.selectedResolution,
        resList: keys,
        repeat: true,
        hideControl: true,
        videoEnd: this.videoEnd,
        goBack: this.goBack,
        fullScreen: this.fullScreen,
        normalScreen: this.normalScreen,
        setRes: this.setRes
      };
      player = <VideoPlayer {...info} />;
    }

    return (
      <div className="video-wrapper">
        {ad}
        {player}

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
