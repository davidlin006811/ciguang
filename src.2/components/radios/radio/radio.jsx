import React, { PureComponent } from "react";
import InfiniteScroll from "react-infinite-scroller";
import qs from "qs";
import $ from "jquery";
import {
  numberToTime,
  getMobileOperatingSystem,
  isLandscape,
  compareDate
} from "../../commonFunctions";
import { PreTxt, SharePreTxt } from "../../commonConst";
import favoriteNImg from "../../image/favorite-n.svg";
import favoriteImg from "../../image/favorite.svg";
import downloadImg from "../../image/download.svg";
import shareImg from "../../image/share.svg";
import playImg from "../../image/play_radio.svg";
import bgImg from "../../image/audio_bg.jpg";
import preImg from "../../image/prev.png";
import nextImg from "../../image/next.png";
import playRadioImg from "../../image/play.png";
import playInOrderImg from "../../image/in_order.png";
import singleLoopImg from "../../image/single-loop.png";
import loopImg from "../../image/loop.png";
import loveImg from "../../image/love_white.png";
import download2Img from "../../image/download_white.png";
import share2Img from "../../image/share_white.png";
import pauseImg from "../../image/pause.svg";
import loadingImg from "../../image/loading.gif";
import "./radio.css";
import Share from "../../share/share";
import AD from "../../ad/ad";
class Radio extends PureComponent {
  constructor(props) {
    super(props);
    let queryString = qs.parse(this.props.location.search.slice(1));
    this.qS = queryString;
    let api =
      PreTxt +
      "radio/" +
      this.props.match.params.id +
      "?client=" +
      queryString.client +
      "&v=" +
      queryString.v +
      "&album_id=" +
      queryString.album_id;
    let toolbar = "1";
    if (queryString.toolbar !== null) {
      toolbar = queryString.toolbar;
    }
    let showAD = true;
    if (queryString.hint !== null && queryString.hint === "0") {
      showAD = false;
    }
    let landscape = isLandscape();
    this.state = {
      API: api,
      list: [],
      toolbar: toolbar,
      playTimes: {},
      comments: {},
      currentPlayIndex: -1,
      isPlaying: false,
      currentTime: "0:00:00",
      currentNum: 0,
      playMode: "order",
      timeDrag: false,
      finish: false,
      canPlay: false,
      showShare: false,
      landscape: landscape,
      dataReady: false,
      showAD: showAD
    };
    this.mounted = false;
  }
  goBack = e => {
    this.props.history.goBack();
  };
  /* select love icon color */
  setComment = item => {
    let oldComments;
    oldComments = this.state.comments;
    oldComments[item.id] = !oldComments[item.id];
    this.setState(state => ({
      comments: { ...oldComments }
    }));
  };
  handleComment = item => {
    let oldComments;
    oldComments = this.state.comments;
    oldComments[item.id] = !oldComments[item.id];
    this.setState(state => ({
      comments: { ...oldComments }
    }));
    const cat = localStorage.getItem("radio-fav-list");
    let favList = cat !== null ? JSON.parse(cat) : [];

    if (oldComments[item.id]) {
      let currentDate = new Date();
      let standardMode = false;
      let date = compareDate(currentDate, standardMode);
      let url =
        "/radio/" +
        this.props.match.params.id +
        "?client=" +
        this.qS.client +
        "&v=" +
        this.qS.v +
        "&album_id=" +
        this.qS.album_id +
        "&itemid=" +
        item.id;
      let newItem = {
        id: item.id,
        title: item.title,
        picture: item.pic,
        url: url,
        date: date
      };
      favList.push(newItem);
    } else {
      let index = favList.findIndex(x => {
        return x.id === item.id;
      });
      if (index >= 0) {
        favList.splice(index, 1);
      }
    }
    localStorage.setItem("radio-fav-list", JSON.stringify(favList));
  };

  setPlayTimeForAll = playList => {
    for (let i = 0; i < playList.length; i++) {
      let id = playList[i].id;
      let playTimes = this.state.playTimes;
      let prePlayTime = localStorage.getItem("radio-playtime-" + id);
      if (prePlayTime !== null) {
        let playTime = JSON.parse(prePlayTime);
        playTimes[id] = playTime;
      } else {
        playTimes[id] = "0:00:00";
      }
      this.setState({
        playTimes: playTimes
      });
    }
  };
  //更新进度条
  updateProgressBar = (xPosition, finish) => {
    if (!this.mounted) {
      return;
    }
    let progressBar = $("#radioProgressBar");
    let progressBarWidth = progressBar.width();
    let radioProges = $("#radioProgress");
    let duration = this.state.list[this.state.currentPlayIndex].duration;
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
    radioProges.width(parseInt(position, 10));
    let current = parseInt((percentage * duration) / 100, 10);
    let currentTime = numberToTime(current);
    this.setState({
      currentNum: current,
      currentTime: currentTime
    });
    if (finish) {
      let radio = document.getElementById("audioPlayer");
      radio.pause();
      radio.currentTime = current;
      setTimeout(() => {
        radio.play();
      }, 300);
      // radio.play();
    }
  };
  enableMouseDrag = () => {
    let audio = document.getElementById("audioPlayer");
    audio.pause();
    this.setState({
      timeDrag: true
    });
  };
  disableMouseDrag = () => {
    this.setState({
      timeDrag: false
    });
  };
  //更新当前播放时间
  updateTime = () => {
    if (!this.mounted) {
      return;
    }
    let current = document.getElementById("audioPlayer").currentTime;
    //console.log("current: ", current);
    if (typeof current === "undefined") {
      return;
    }

    let currentNum = parseInt(current, 10);
    let currentTime = numberToTime(currentNum);
    let playTimes = this.state.playTimes;
    let id = this.state.list[this.state.currentPlayIndex].id;
    playTimes[id] = currentNum;

    this.setState({
      playTimes: playTimes,
      currentTime: currentTime,
      currentNum: currentNum
    });
  };
  handleCurrenAudio = () => {
    let audio = document.getElementById("audioPlayer");
    let isPlaying = !this.state.isPlaying;
    this.setState({
      isPlaying: isPlaying,
      canPlay: true
    });
    if (!isPlaying) {
      $("#audioPlayIcon").addClass("off");
      audio.pause();
    } else {
      $("#audioPlayIcon").removeClass("off");
      if (audio !== null) {
        audio.play();
      }
    }
  };
  selectAudio = index => {
    let audio = document.getElementById("audioPlayer");
    //console.log(audio);
    if (index === this.state.currentPlayIndex) {
      this.handleCurrenAudio();
    } else if (this.state.currentPlayIndex >= 0) {
      audio.pause();
      let source = document.getElementById("audioSource");
      source.setAttribute("src", this.state.list[index].music_url);
      audio.load();
      audio.currentTime = this.state.playTimes[this.state.list[index].id];
      this.setState({
        currentPlayIndex: index,
        canPlay: true,
        isPlaying: true,
        currentNum: this.state.playTimes[this.state.list[index].id],
        currentTime: numberToTime(
          this.state.playTimes[this.state.list[index].id]
        )
      });
      audio.play();
    } else {
      this.setState({
        currentPlayIndex: index,
        isPlaying: true
      });
    }
  };

  fetchPage = (api, callback) => {
    //console.log("api: ", api);
    fetch(api, { method: "get" })
      .then(result => {
        return result.json();
      })
      .then(data => {
        if (data.code === 1) {
          let list = data.data.rows;
          callback(list);
        }
      });
  };
  playNextAudio = () => {
    let nextIndex;
    if (this.state.currentPlayIndex === this.state.list.length - 1) {
      nextIndex = 0;
    } else {
      nextIndex = this.state.currentPlayIndex + 1;
    }
    //console.log("next index: ", nextIndex);
    this.selectAudio(nextIndex);
  };
  playPreAudio = () => {
    if (this.state.currentPlayIndex === 0) {
      return;
    }
    let preIndex = this.state.currentPlayIndex - 1;
    this.selectAudio(preIndex);
  };
  switchMode = () => {
    if (this.state.playMode === "order") {
      this.setState({
        playMode: "singleLoop"
      });
    } else if (this.state.playMode === "singleLoop") {
      this.setState({
        playMode: "loop"
      });
    } else if (this.state.playMode === "loop") {
      this.setState({
        playMode: "order"
      });
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
  loadMore = () => {
    if (this.state.currentPage === this.state.pages) {
      this.setState({
        noMore: true
      });
      return;
    }
    if (this.state.fetching) {
      return;
    }
    let pageNo = this.state.currentPage + 1;
    let pageAPI = this.state.API + "&page=" + pageNo;

    this.setState({
      fetching: true
    });
    //console.log("page api: ", pageAPI);
    fetch(pageAPI)
      .then(result => {
        return result.json();
      })
      .then(data => {
        if (data.code === 1) {
          let playTimes = this.state.playTimes;
          let comments = this.state.comments;
          for (let i = 0; i < data.data.rows.length; i++) {
            let id = data.data.rows[i].id;
            playTimes[id] = 0;
            comments[id] = false;
          }
          let noMore = this.state.pages === data.data.curr_page ? true : false;
          if (this.mounted) {
            this.setState({
              list: this.state.list.concat(data.data.rows),
              currentPage: parseInt(data.data.curr_page, 10),
              playTimes: playTimes,
              comments: comments,
              noMore: noMore,
              fetching: false
            });
          }
        }
      });
  };
  closeAd = () => {
    this.setState({
      showAD: false
    });
  };
  componentDidMount() {
    this.mounted = true;
    let OS = getMobileOperatingSystem();
    //从localstorage读取电台一级栏目

    //console.log("api: ", api);
    fetch(this.state.API, { method: "get" })
      .then(result => {
        return result.json();
      })
      .then(data => {
        // console.log(data);
        if (data.code === 1) {
          document.title = data.data.cat_title;

          let list = data.data.rows;
          let pages = data.data.pages;

          let playTimes = {};
          let comments = {};
          let cat = localStorage.getItem("radio-fav-list");
          let favList = cat !== null ? JSON.parse(cat) : [];
          for (let i = 0; i < list.length; i++) {
            let id = list[i].id;
            playTimes[id] = 0;
            let index = favList.findIndex(x => {
              return x.id === id;
            });
            if (index >= 0) {
              comments[id] = true;
            } else {
              comments[id] = false;
            }
          }
          //选择当前播放的电台
          let currentRadioIndex = 0;
          if (this.qS.itemid !== null) {
            let currentId = parseInt(this.qS.itemid, 10);
            let foundIndex = list.findIndex(x => {
              return x.id === currentId;
            });
            if (foundIndex >= 0) {
              currentRadioIndex = foundIndex;
            }
          }
          let isPlaying = OS === "iOS" ? false : true;
          let canPlay = OS === "iOS" ? false : true;
          let noMore =
            parseInt(data.data.curr_page, 10) === parseInt(data.data.pages, 10)
              ? true
              : false;
          if (this.mounted) {
            this.setState({
              OS: OS,
              id: data.data.cat_id,
              list: list,
              playTimes: playTimes,
              comments: comments,
              currentPage: parseInt(data.data.curr_page, 10),
              pages: parseInt(pages, 10),
              finish: true,
              catTitle: data.data.cat_title,
              categoryTitle: data.data.categoryTitle,
              currentPlayIndex: currentRadioIndex,
              isPlaying: isPlaying,
              canPlay: canPlay,
              noMore: noMore,
              dataReady: true
            });
          }
        }
      });
  }

  componentDidUpdate() {
    let audio = $("#audioPlayer");
    if (audio !== null) {
      audio.on("timeupdate", this.updateTime);
      //如果视频加载完成，移除等待画面
      if (this.state.OS === "iOS") {
        audio.on("canplay", () => {
          if (
            this.state.playTimes[
              this.state.list[this.state.currentPlayIndex].id
            ] > 0
          ) {
            audio.get(0).currentTime = this.state.playTimes[
              this.state.list[this.state.currentPlayIndex].id
            ];
          }
          if (this.state.canPlay) {
            audio.get(0).play();
          }
        });
      }

      //监听loadmetadata完成事件，如果完成，设置视频时长
      audio.on("loadedmetadata", () => {
        let audioDuration = document.getElementById("audioPlayer").duration;
        if (audioDuration !== null && audioDuration > 0) {
          let duration = parseInt(audioDuration, 10);
          let list = this.state.list;
          if (
            list[this.state.currentPlayIndex].duration !== duration &&
            this.mounted
          ) {
            list[this.state.currentPlayIndex].duration = duration;
            this.setState({
              list: list
            });
          }
        }
      });

      audio.on("ended", () => {
        if (!this.mounted) {
          return;
        }
        if (
          this.state.currentNum >=
          this.state.list[this.state.currentPlayIndex].duration
        ) {
          let playTimes = this.state.playTimes;
          playTimes[this.state.list[this.state.currentPlayIndex].id] = 0;
          if (this.state.playMode === "singleLoop") {
            //console.log("single loop");
            let index = this.state.currentPlayIndex;
            let audioPlayer = document.getElementById("audioPlayer");
            audioPlayer.pause();
            let source = document.getElementById("audioSource");
            source.setAttribute("src", this.state.list[index].music_url);
            audioPlayer.load();

            //console.log("audio index: ", index);

            this.setState({
              currentPlayIndex: index,
              isPlaying: true,
              currentNum: 0,
              currentTime: "00:00:00",
              playTimes: playTimes
            });
            audioPlayer.currentTime = 0;
            audioPlayer.play();
            return;
          }

          this.setState({
            isPlaying: false,
            playTimes: playTimes
          });
          if (this.state.currentPlayIndex === this.state.list.length - 1) {
            if (this.state.playMode === "order") {
              $("#audioPlayIcon").addClass("off");
              return;
            }
            if (this.state.playMode === "loop") {
              this.selectAudio(0);
              return;
            }
          } else {
            this.playNextAudio();
          }
        }
      });
    }
    //拖曳进度条
    let timeDrag = this.state.timeDrag;
    $("#radio-progress-button").on("touchstart", () => {
      //console.log("mouse down");

      this.enableMouseDrag();
    });
    $("#radio-progress-button").on("touchmove", e => {
      //  console.log("touch move", e);

      if (timeDrag) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          this.updateProgressBar(e.changedTouches[i].pageX, false);
        }
      }
    });
    $("#radio-progress-button").on("touchend", e => {
      if (timeDrag) {
        this.updateProgressBar(e.changedTouches[0].pageX, true);
      }
      this.disableMouseDrag();
    });
    clearInterval(this.checkOrientation);
    this.checkOrientation = setInterval(() => {
      let landscape = isLandscape();
      if (landscape !== this.state.landscape && this.mounted) {
        this.setState({
          landscape: landscape
        });
      }
    }, 100);
  }
  componentWillUnmount() {
    this.mounted = false;
    clearInterval(this.checkOrientation);
  }
  render() {
    //console.log(this.state);
    let progressBar,
      controlBar,
      timeBar,
      radioTitle,
      radioInfo,
      player,
      playComponent;
    let marginTop = this.state.showAD && !isLandscape() ? "39px" : 0;
    let loading =
      this.state.finish === false ? (
        <div
          style={{
            width: "100%",
            paddingTop: "50px",
            paddingLeft: "32%",
            paddingBottom: "20px",
            fontSize: "14px",
            backgroundColor: "#f2f3f8"
          }}
        >
          <img src={loadingImg} alt="正在加載數據" style={{ width: "30px" }} />
          <span style={{ fontWeight: "bold" }}>正在加載數據</span>
        </div>
      ) : null;
    //console.log("title: ", title);
    let currentIndex = this.state.currentPlayIndex;

    if (this.state.currentPlayIndex >= 0) {
      player = (
        <div className="audio-player">
          <img
            id="playBackground"
            src={this.state.list[currentIndex].cover}
            alt="backgroundimg"
          />
          <audio id="audioPlayer" autoPlay>
            <source
              id="audioSource"
              src={this.state.list[currentIndex].music_url}
            />
          </audio>
        </div>
      );
      let progressWidth =
        (this.state.currentNum /
          this.state.list[this.state.currentPlayIndex].duration) *
        window.innerWidth *
        0.7;
      //渲染进度条
      progressBar = (
        <div id="radioProgressBar" className="radio-control-bar">
          <div id="radioProgress" style={{ width: progressWidth }}>
            <span id="radio-progress-button" />
          </div>
        </div>
      );

      //渲染控制栏
      let playIcon = this.state.isPlaying ? pauseImg : playRadioImg;
      controlBar = (
        <div id="radio-control">
          <div className="preNav" onClick={this.playPreAudio}>
            <img src={preImg} alt="pre" />
          </div>
          <div className="playNav" onClick={this.handleCurrenAudio}>
            <img src={playIcon} alt="play" />
          </div>
          <div className="nextNav" onClick={this.playNextAudio}>
            <img src={nextImg} alt="next" />
          </div>
        </div>
      );

      //渲染时间栏和循环
      let modeBtn = playInOrderImg;
      if (this.state.playMode === "singleLoop") {
        modeBtn = singleLoopImg;
      } else if (this.state.playMode === "loop") {
        modeBtn = loopImg;
      }
      let duration = numberToTime(
        this.state.list[this.state.currentPlayIndex].duration
      );
      timeBar = (
        <div className="radio-time-bar">
          <img
            src={modeBtn}
            alt="btn"
            className="radio-loop"
            onClick={this.switchMode}
          />
          <span className="start-time">{this.state.currentTime}</span>
          <span>|</span>
          <span className="end-time">{duration}</span>
        </div>
      );

      //渲染音频标题
      radioTitle = (
        <marquee
          behavior="scroll"
          direction="left"
          loop="infinite"
          scrollamount="2"
          scrolldelay="30"
        >
          <span>{this.state.list[this.state.currentPlayIndex].title}</span>
          <span style={{ paddingLeft: "85%" }}>
            {this.state.list[this.state.currentPlayIndex].title}
          </span>
        </marquee>
      );

      //渲染菜单栏
      let menuBar = (
        <div id="radioNav" className="radio-menu-bar">
          <div
            onClick={e => {
              this.goBack(e);
            }}
            className="radio-return-btn"
          >
            <i className="fas fa-chevron-left" />
          </div>
          {radioTitle}
        </div>
      );
      //渲染当前播放的电台信息栏
      let commentImg =
        this.state.comments[this.state.list[this.state.currentPlayIndex].id] ===
        false
          ? loveImg
          : favoriteImg;
      let radioCat;
      let videoPlay = $(".audio-player");
      if (videoPlay !== null) {
        radioCat =
          videoPlay.height() > 200 ? (
            <div className="current-radio-cat">
              <span>{this.state.catTitle}</span>
            </div>
          ) : null;
      }

      radioInfo = (
        <div className="current-radio-info">
          {radioCat}
          <div>
            <img
              src={commentImg}
              alt="love"
              onClick={e => {
                e.stopPropagation();
                this.handleComment(
                  this.state.list[this.state.currentPlayIndex]
                );
              }}
            />
            <img src={download2Img} alt="download" className="mid-image" />
            <img src={share2Img} alt="share" />
          </div>
        </div>
      );
      let portaitHeight = (window.innerWidth * 9) / 16;
      let bgImage = $("#playBackground");
      if (bgImage !== null) {
        let imgHeight = bgImage.height();
        portaitHeight = imgHeight > portaitHeight ? imgHeight : portaitHeight;
      }
      let height = this.state.landscape ? window.innerHeight : portaitHeight;

      playComponent = (
        <div
          className="play-audio-component"
          style={{ height: height, marginTop: marginTop }}
        >
          {menuBar}
          {radioInfo}
          {controlBar}
          {timeBar}
          {progressBar}
        </div>
      );
    } else {
      player = (
        <div className="audio-player">
          <div
            onClick={e => {
              this.goBack(e);
            }}
            className="radio-return-btn-empty"
          >
            <i className="fas fa-chevron-left" />
          </div>

          <img src={bgImg} alt="backgroundimg" />
        </div>
      );
    }

    //渲染音频列表
    let radioList = this.state.list.map((item, index) => {
      let totalTimeItem = numberToTime(item.duration);
      let commentImg =
        this.state.comments[item.id] === false ? favoriteNImg : favoriteImg;
      let playingIcon = null;
      if (index === this.state.currentPlayIndex && this.state.canPlay) {
        playingIcon = (
          <div id="audioPlayIcon">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        );
      } else {
        playingIcon = <img src={playImg} alt="play" />;
      }

      let playTime =
        index === this.state.currentPlayIndex
          ? this.state.currentTime
          : numberToTime(this.state.playTimes[item.id]);
      return (
        <div
          className="radio-player-item"
          key={index}
          onClick={() => {
            this.selectAudio(index);
          }}
        >
          <div className="radio-player-icon">{playingIcon}</div>
          <div className="radio-info">
            <h6 className="radio-info-title">{item.title}</h6>
            <div className="radio-play-time-desc">
              <span className="radio-play-time">{playTime}</span>|
              <span className="radio-duration-time">{totalTimeItem}</span>
            </div>
            <div className="radio-footer">
              <div className="radio-cat">{this.state.catTitle}</div>
              <div className="radio-date">{item.date}</div>
              <div className="radio-action">
                <img src={downloadImg} alt="download" />
                <img
                  src={shareImg}
                  alt="share"
                  onClick={e => {
                    e.stopPropagation();
                    this.showShare(item);
                  }}
                />
                <img
                  src={commentImg}
                  alt="favorite"
                  onClick={e => {
                    e.stopPropagation();
                    this.handleComment(item);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      );
    });
    //设置分享界面
    let shareComponent;

    if (this.state.showShare) {
      let shareUrl =
        SharePreTxt +
        "/radio/" +
        this.props.match.params.id +
        "?client=" +
        this.qS.client +
        "&v=" +
        this.qS.v +
        "&album_id=" +
        this.qS.album_id +
        "&itemid=" +
        this.state.shareItem.id +
        "&toolbar=0";

      shareComponent = (
        <div className="share-component">
          <Share
            url={shareUrl}
            title={this.state.shareItem.title}
            image={this.state.shareItem.share_image}
            description={this.state.shareItem.share_title}
            hideShare={this.hideShare}
          />
        </div>
      );
    }

    let loadingScreen = (
      <div key={this.props.match.params.id} style={{ textAlign: "center" }}>
        <img src={loadingImg} style={{ width: "24px" }} alt="loading" />
        <span>正在載入更多數據 ...</span>
      </div>
    );
    let endMessage =
      this.state.noMore === true && this.state.dataReady === true ? (
        <p
          style={{
            fontSize: "14px",
            fontWeight: "bold",
            textAlign: "center",
            paddingTop: "20px",
            paddingBottom: "20px"
          }}
        >
          <i
            className="fas fa-long-arrow-alt-up"
            style={{ paddingRight: "10px" }}
          />
          已經全部加載完畢
        </p>
      ) : null;
    let ad;
    if (this.state.showAD && !isLandscape()) {
      ad = <AD closeAd={this.closeAd} />;
    }
    return (
      <div className="radio-player-component">
        {ad}
        {player}
        {playComponent}
        {loading}
        <div className="radio-player-list">
          <InfiniteScroll
            pageStart={0}
            loadMore={this.loadMore}
            hasMore={!this.state.noMore}
            loader={loadingScreen}
            useWindow={false}
          >
            {radioList}
          </InfiniteScroll>
          {endMessage}
        </div>
        {shareComponent}
      </div>
    );
  }
}
export default Radio;
