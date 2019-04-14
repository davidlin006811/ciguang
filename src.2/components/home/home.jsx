import React, { PureComponent } from "react";
import { isMobile } from "react-device-detect";
import { Link } from "react-router-dom";
import { InfoListAPI } from "../commonConst";
import Slider from "../silder/slideShow";
import AD from "../ad/ad";
import Searches from "../search/searches";
import LatestInfo from "../latest-info/latest-info";
import TabMenu from "../tabMenu/tabMenu";
import errorImg from "../image/sorry.jpg";
import "./home.css";
import "../component.css";
import liveImg from "../image/icon-live.png";
import videoImg from "../image/icon-video.png";
import essenceImg from "../image/icon-essence.png";
import pictureImg from "../image/icon-images.png";
import radioImg from "../image/icon-radio.png";
import specialImg from "../image/icon-special.png";
import footerImg from "../image/footer.png";
import catBgImg from "../image/cat_bg.png";

class Home extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      flash: false,
      showAd: true
    };
  }

  closeAd = () => {
    this.setState({
      showAd: false
    });
  };
  componentWillMount() {
    sessionStorage.removeItem("data");
  }
  componentDidMount() {
    document.title = "慈光";
  }
  render() {
    if (isMobile) {
      const bg = {
        backgroundImage: "url(" + catBgImg + ")",
        padding: "0"
      };
      let ad;
      if (this.state.showAd) {
        ad = <AD closeAd={this.closeAd} />;
      }

      let main = (
        <div className="home">
          <Slider flash={this.state.flash} />
          <div className="function-model">
            <Link className="link-grid up left" to="/live" style={bg}>
              <img src={liveImg} alt="live" />
              <p>直播</p>
            </Link>
            <Link className="link-grid up middle" to="/videos" style={bg}>
              <img src={videoImg} alt="video" />
              <p>視頻</p>
            </Link>

            <Link className="link-grid up right" to="/photos" style={bg}>
              <img src={pictureImg} alt="图片" />
              <p>圖片</p>
            </Link>
            <Link className="link-grid bottom left" to="/radios" style={bg}>
              <img src={radioImg} alt="radio" />
              <p>電臺</p>
            </Link>
            <Link className="link-grid bottom middle" to="/specials" style={bg}>
              <img src={specialImg} alt="special" />
              <p>專題</p>
            </Link>
            <Link className="link-grid bottom right" to="/essences" style={bg}>
              <img src={essenceImg} alt="essence" />
              <p>精華</p>
            </Link>
          </div>
          <LatestInfo api={InfoListAPI} />
          <div className="footer">
            <img src={footerImg} alt="宏開覺路 普化眾生" />
          </div>
        </div>
      );

      return (
        <React.Fragment>
          <Searches />
          {ad}
          {main}
          <TabMenu role="home" />
        </React.Fragment>
      );
    } else {
      return (
        <div className="no-access">
          <div className="no-access-title">
            <img src={errorImg} alt="系统错误" />
            <h3>此網站只支持移動設備，敬請包涵！</h3>
          </div>
        </div>
      );
    }
  }
}
export default Home;
