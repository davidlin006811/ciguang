import React, { PureComponent } from "react";
//import Swiper from "react-id-swiper";
import { AndroidAPPLink, IOSAPPLink } from "../commonConst";
//import { isLandscape } from "../commonFunctions";
import Callup from "tool-callapp";
import "./ad.css";
import logo from "../image/logo.png";
//import iOSImg from "../image/ios_h.png";
//import androidImg from "../image/android_h.png";
import closeImg from "../image/close_gray.svg";
//import subCloseImg from "../image/close.png";

class AD extends PureComponent {
  constructor(props) {
    super(props);
    /* this.state = {
      showAd: false,
      //landscape: isLandscape()
    };*/
    this.callup = new Callup({
      // 协议头
      PROTOCAL: "ciguang",

      // 主页
      HOME: "live",

      // 唤起失败时的跳转链接
      FAILBACK: {
        ANDROID: AndroidAPPLink,
        IOS: IOSAPPLink
      },

      // Android apk 相关信息
      APK_INFO: {
        PKG: "org.ciguang.www.cgmp",
        CATEGORY: "android.intent.category.LAUNCHER",
        ACTION: "android.intent.action.MAIN"
      },

      // 唤起超时时间，超时则跳转到下载页面
      LOAD_WAITING: 3000
    });
  }
  handleAd = () => {
    /* let showAd = !this.state.showAd;
    this.setState({
      showAd: showAd
    });*/
    // var url = "url/" + encodeURIComponent("https://www.ciguang.org");
    this.callup.loadSchema({
      targetURI: "live"
    });
  };
  closeAd = () => {
    this.props.closeAd();
  };
  /* closePopup = () => {
    this.setState({
      showAd: false
    });
  };
  componentDidUpdate() {
    clearInterval(this.checkOrientaion);
    this.checkOrientaion = setInterval(() => {
      let landscape = isLandscape();
      if (landscape !== this.state.landscape) {
        this.setState({
          landscape: landscape
        });
      }
    }, 300);
  }
  componentWillUnmount() {
    if (this.checkOrientaion) {
      clearInterval(this.checkOrientaion);
    }
  }*/
  render() {
    //console.log(this.props);
    /*  const params = {
      direction: "horizontal",

      autoplay: {
        delay: 60000,
        disableOnInteraction: false
      },
      loop: true,
      slidesPerView: "auto",
      effect: "slide",
      shouldSwiperUpdate: true
    };
     let ad;
    if (this.state.showAd) {
      // let height = window.innerHeight - 50;
      //let liHeight = height - 50;
      let bodyClass = this.state.landscape ? "ad-body-landscape" : "ad-body";
      let itemClass = this.state.landscape ? "ad-item-landscape" : "ad-item";
      ad = (
        <div className={bodyClass}>
          <div className="ad-sub-close">
            <img src={subCloseImg} alt="sub-close" onClick={this.closePopup} />
          </div>
          <p>手指滑动切换图片</p>
          <ul>
            <Swiper {...params}>
              <li>
                <img src={iOSImg} alt="iOS" className={itemClass} />
                <h5>iOS版</h5>
                <h6>請用手機掃碼下載</h6>
              </li>
              <li>
                <img src={androidImg} alt="android" className={itemClass} />
                <h5>Android版</h5>
                <h6>請用手機掃碼下載</h6>
              </li>
              <li>
                <img src={iOSImg} alt="iOS" className={itemClass} />
                <h5>iOS版</h5>
                <h6>請用手機掃碼下載</h6>
              </li>
              <li>
                <img src={androidImg} alt="android" className={itemClass} />
                <h5>Android版</h5>
                <h6>請用手機掃碼下載</h6>
              </li>
              <li>
                <img src={iOSImg} alt="iOS" className={itemClass} />
                <h5>iOS版</h5>
                <h6>請用手機掃碼下載</h6>
              </li>
              <li>
                <img src={androidImg} alt="android" className={itemClass} />
                <h5>Android版</h5>
                <h6>請用手機掃碼下載</h6>
              </li>
            </Swiper>
          </ul>
        </div>
      );
    }*/

    let bgColor =
      this.props.bgColor !== "undefind"
        ? { backgroundColor: this.props.bgColor }
        : null;
    let frontColor =
      this.props.color !== "undefind" ? { color: this.props.color } : null;
    return (
      <div id="adComponent" className="ad-component" style={bgColor}>
        <div className="ad-header">
          <div className="add-close">
            <img src={closeImg} alt="close" onClick={this.closeAd} />
          </div>
          <div className="ad-logo" style={frontColor}>
            <img src={logo} alt="logo" />
            慈光講堂
          </div>
          <div className="app-open">
            <span onClick={this.handleAd}>打開</span>
          </div>
        </div>
      </div>
    );
  }
}
export default AD;
