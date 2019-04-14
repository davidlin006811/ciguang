import React, { Component } from "react";
import MediaQuery from "react-responsive";
import {
  PhotoListPreTxt,
  musicUrlPreTxt,
  SharePreTxt
} from "../../commonConst";

import Swiper from "swiper/dist/js/swiper";
import qs from "qs";
import Share from "../../share/share";
import AD from "../../ad/ad";
import slideshowImg from "../../image/slideshow.png";
import pauseImg from "../../image/pause.svg";
import volumeImg from "../../image/volume.png";
import downloadImg from "../../image/download.png";
import shareImg from "../../image/share.png";
import "./photo.css";

class Photo extends Component {
  constructor(props) {
    super(props);
    let qsString = qs.parse(props.location.search.slice(1));
    let catId = parseInt(qsString.catid, 10);
    let id = -1;
    let musicUrl = "";
    if (qsString.id !== undefined) {
      id = parseInt(qsString.id, 10);
      let parentNum = qsString.parentNum;
      musicUrl = musicUrlPreTxt + parentNum + "/" + parentNum + ".mp3";
      /*let num = qsString.num;
      src = PicPreTxt + parentNum + "/" + num + "-1800_1800.jpg";*/
    }
    let play = false;
    if (qsString.play !== undefined) {
      play = qsString.play;
    }
    let albumId = -1;
    if (qsString.albumid !== undefined) {
      albumId = parseInt(qsString.albumid, 10);
    }
    let api =
      albumId > 0
        ? PhotoListPreTxt + catId + "&albumid=" + albumId
        : PhotoListPreTxt + catId;
    let showAD = true;
    if (qsString.hint !== null && qsString.hint === "0") {
      showAD = false;
    }
    this.state = {
      list: [],
      catId: catId,
      api: api,
      currentSelectPhotoId: id,
      musicUrl: musicUrl,
      showMenu: false,
      showSlides: play,
      albumId: albumId,
      muted: play,
      showShare: false,
      dataReady: false,
      showAD: showAD
    };
    this.mounted = false;
    this.timer = null;
  }
  goBack = () => {
    this.props.history.goBack();
  };
  closeAd = () => {
    this.setState({
      showAD: false
    });
  };
  fetchPhotoList = () => {
    fetch(this.state.api, { method: "get" })
      .then(result => {
        return result.json();
      })
      .then(data => {
        if (data.code === 1) {
          //console.log(data);
          let currentSelectedIndex = 0;
          if (this.state.currentSelectPhotoId > -1) {
            currentSelectedIndex = data.data.rows.findIndex(x => {
              return x.id === this.state.currentSelectPhotoId;
            });
          }
          let musicUrl = this.state.musicUrl;
          if (this.state.albumId > -1) {
            let parentNum = data.data.rows[0].parent_num;
            musicUrl = musicUrlPreTxt + parentNum + "/" + parentNum + ".mp3";
          }
          if (this.mounted) {
            this.setState({
              list: data.data.rows,
              currentSelectedIndex: currentSelectedIndex,
              musicUrl: musicUrl,
              dataReady: true
            });
            sessionStorage.setItem(
              "active-photo-index",
              JSON.stringify(currentSelectedIndex)
            );
          }
        }
      });
  };
  switchSlideShow = () => {
    let showSlides = !this.state.showSlides;
    this.setState({
      showSlides: showSlides
    });
  };
  turnOnVolume = () => {
    let vid = document.getElementById("audioPlayer");
    vid.load();
    vid.play();
    this.setState({
      muted: false
    });
  };
  showMenu = () => {
    if (!this.state.dataReady) {
      return;
    }
    this.setState({
      showMenu: true
    });
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.setState({
        showMenu: false
      });
    }, 10000);
  };
  showShare = () => {
    let currentActiveIndex = 0;
    let activeIndex = sessionStorage.getItem("active-photo-index");
    if (activeIndex !== null) {
      currentActiveIndex = JSON.parse(activeIndex);
    }
    let item = this.state.list[currentActiveIndex];
    this.setState({
      showShare: true,
      shareItem: item
    });
  };
  hideShare = () => {
    this.setState({
      showShare: false
    });
  };
  componentDidMount() {
    this.mounted = true;
    this.fetchPhotoList();
  }
  componentWillUnmount() {
    if (this.picSwiper) {
      this.picSwiper.destroy();
    }
    this.mounted = false;
    clearTimeout(this.timer);
  }
  componentDidUpdate() {
    if (this.picSwiper) {
      this.picSwiper.update();
      //this.picSwiper.slideTo(this.state.currentSelectedIndex, 0);
    } else if (this.state.dataReady) {
      this.picSwiper = new Swiper("#picList", {
        pagination: {
          el: ".swiper-pagination",
          clickable: true
        },
        slidesPerView: "auto",
        autoplay: { delay: 10000 },
        on: {
          autoplay: function() {
            sessionStorage.setItem(
              "active-photo-index",
              JSON.stringify(this.activeIndex)
            );
          },
          slideChangeTransitionStart: function() {
            sessionStorage.setItem(
              "active-photo-index",
              JSON.stringify(this.activeIndex)
            );
          }
        }
      });
      this.picSwiper.update();
      this.picSwiper.slideTo(this.state.currentSelectedIndex, 0);
    }
    if (this.state.showSlides) {
      this.picSwiper.autoplay.start();
    } else {
      this.picSwiper.autoplay.stop();
    }
  }
  render() {
    // console.log(this.state);

    let menubar = null;
    if (this.state.showMenu) {
      let imgSrc = this.state.showSlides ? pauseImg : slideshowImg;
      menubar = (
        <div>
          <div
            className="return-btn"
            style={{ height: "40px" }}
            onClick={this.goBack}
          >
            <i className="iconfont" style={{ fontSize: "20px" }}>
              &#xe66f;
            </i>
          </div>
          <div className="slide-show-play" onClick={this.switchSlideShow}>
            <img src={imgSrc} alt="menu" />
          </div>
          <div className="pic-bottom-menu">
            <div className="pic-download">
              <img src={downloadImg} alt="download" />
            </div>
            <div className="pic-share">
              <img
                src={shareImg}
                alt="share"
                onClick={() => {
                  this.showShare();
                }}
              />
            </div>
          </div>
        </div>
      );
    }
    let music;
    if (this.state.showSlides) {
      music = (
        <audio id="audioPlayer" autoPlay>
          <source src={this.state.musicUrl} />
        </audio>
      );
    }

    let volume;
    if (this.state.muted) {
      let topOffset = this.state.showAD ? "60px" : "20px";
      volume = (
        <div
          className="slideshow-volume-hint"
          style={{ top: topOffset }}
          onClick={this.turnOnVolume}
        >
          <img src={volumeImg} alt="volume" />
          <span>点击打开音量</span>
        </div>
      );
    }
    let share;
    if (this.state.showShare) {
      let shareUrl =
        SharePreTxt +
        "/pic/" +
        this.props.match.params.id +
        "?catid=" +
        this.state.catId +
        "&parentNum=" +
        this.state.shareItem.parent_num +
        "&num=" +
        this.state.shareItem.num +
        "&id=" +
        this.state.shareItem.id;
      // console.log("share url: ", shareUrl);
      share = (
        <React.Fragment>
          <MediaQuery query="(orientation: portrait)">
            <div className="share-component">
              <Share
                url={shareUrl}
                title={this.state.shareItem.title}
                image={this.state.shareItem.share_image}
                description={this.state.shareItem.share_title}
                hideShare={this.hideShare}
              />
            </div>
          </MediaQuery>
          <MediaQuery query="(orientation: landscape)">
            <div className="share-component-landscape">
              <Share
                url={shareUrl}
                title={this.state.shareItem.title}
                image={this.state.shareItem.share_image}
                description={this.state.shareItem.share_title}
                hideShare={this.hideShare}
              />
            </div>
          </MediaQuery>
        </React.Fragment>
      );
    }
    let ad;
    if (this.state.showAD) {
      ad = <AD closeAd={this.closeAd} />;
    }
    return (
      <div className="pic-component" onClick={this.showMenu}>
        <MediaQuery query="(orientation: portrait)">
          {ad}
          <div className="pic-navigation">{menubar}</div>
        </MediaQuery>
        <MediaQuery query="(orientation: landscape)">
          <div className="pic-navigation-landscape">{menubar}</div>
        </MediaQuery>
        {volume}
        <div
          className="swiper-container swiper-container-horizontal"
          id="picList"
        >
          <div className="swiper-wrapper">
            {this.state.list.map((item, index) => {
              return (
                <div className="swiper-slide" key={index}>
                  <img src={item.pic_big_url} alt="slider" />
                </div>
              );
            })}
          </div>
        </div>
        {music}
        {share}
      </div>
    );
  }
}
export default Photo;
