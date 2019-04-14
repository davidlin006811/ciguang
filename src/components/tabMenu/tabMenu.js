import React, { Component } from "react";
import { Link } from "react-router-dom";
import homeImg from "../image/icon-home-n.png";
import homeActiveImg from "../image/icon-home-h.png";
import favActiveImg from "../image/icon-favorite-h.png";
import favImg from "../image/icon-favorite-n.png";
import infoActiveImg from "../image/icon-info-h.png";
import infoImg from "../image/icon-info-n.png";
import mineActiveImg from "../image/icon-mine-h.png";
import mineImg from "../image/icon-mine-n.png";
import "./tabMenu.css";

class TabMenu extends Component {
  constructor(props) {
    super(props);
    this.activeColor = "#b2885e";
    this.state = {
      homeColor: "#a1a1a1",
      infoColor: "#a1a1a1",
      favColor: "#a1a1a1",
      profileColor: "#a1a1a1",
      homeImg: homeImg,
      infoImg: infoImg,
      favImg: favImg,
      mineImg: mineImg
    };
  }
  componentDidMount() {
    if (this.props.role === "home") {
      this.setState({
        homeColor: this.activeColor,
        homeImg: homeActiveImg
      });
    }
    if (this.props.role === "info") {
      this.setState({
        infoColor: this.activeColor,
        infoImg: infoActiveImg
      });
    }
    if (this.props.role === "myFavorite") {
      this.setState({
        favColor: this.activeColor,
        favActiveImg
      });
    }
    if (this.props.role === "profile") {
      this.setState({
        profileColor: this.activeColor,
        mineImg: mineActiveImg
      });
    }
  }
  render() {
    return (
      <div className="menu-bar" style={{ backgroundColor: "#f6f5fa" }}>
        <ul>
          <li>
            <Link to="/">
              <img src={this.state.homeImg} alt="home" />
              <p style={{ color: this.state.homeColor }}>首頁</p>
            </Link>
          </li>
          <li>
            <Link to="/newsAll">
              <img src={this.state.infoImg} alt="info" />
              <p style={{ color: this.state.infoColor }}>資訊</p>
            </Link>
          </li>
          <li>
            <Link to="/myFavorite">
              <img src={this.state.favImg} alt="favortie" />
              <p style={{ color: this.state.favColor }}>收藏</p>
            </Link>
          </li>
          <li>
            <Link to="/profile">
              <img src={this.state.mineImg} alt="mine" />
              <p style={{ color: this.state.profileColor }}>我的</p>
            </Link>
          </li>
        </ul>
      </div>
    );
  }
}
export default TabMenu;
