import React, { Component } from "react";
import "./navigation-bar.css";
//import Swiper from "swiper";
import Swiper from "swiper/dist/js/swiper.js";
import "swiper/dist/css/swiper.min.css";
import abbrImg from "../image/abbr.svg";

class Navigation extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTabPosition: this.props.activeTabPosition
    };
  }

  showMenuBar = e => {
    e.stopPropagation();
    this.props.showMenuBar();
  };
  componentWillUnmount() {
    if (this.tabSwiper) {
      this.tabSwiper.destroy();
    }
  }

  componentWillUpdate(nextProps, nextState) {
    if (this.tabSwiper) {
      //console.log("slide position: ", this.state.activeTabPosition);
      //console.log(this.props.list);

      if (this.state.activeTabPosition >= 3) {
        this.tabSwiper.slideTo(this.state.activeTabPosition - 2, 0);
      } else {
        this.tabSwiper.slideTo(0, 0);
      }

      sessionStorage.setItem(
        "activePosition",
        JSON.stringify(this.state.activeTabPosition)
      );
    } else {
      this.tabSwiper = new Swiper("#tabs", {
        pagination: {
          el: ".swiper-pagination",
          clickable: true
        },
        freeMode: true,
        effect: "slide",
        speed: 1000,
        slidesPerView: 4
      });
    }
  }
  componentDidUpdate() {
    if (this.tabSwiper) {
      this.tabSwiper.update();
    }
  }

  render() {
    if (this.tabSwiper) {
      this.tabSwiper.update();
    }
    let navClass =
      this.props.toolbar === "0"
        ? "navigation-menu-bar nav-no-margin"
        : "navigation-menu-bar";
    let seprateClass =
      this.props.toolbar === "0" ? "seperate-div-less" : "seperate-div";

    return (
      <React.Fragment>
        <div className={navClass}>
          <div className="nav-swiper-bar">
            <div
              className="swiper-container swiper-container-horizontal"
              id="tabs"
            >
              <div className="swiper-wrapper">
                {this.props.list.map((item, index) => {
                  let tabId = "tab-" + index;
                  let listClass =
                    index === this.state.activeTabPosition
                      ? "swiper-slide navigation-item active"
                      : "swiper-slide navigation-item";
                  let url =
                    typeof this.props.cat !== "undefined" &&
                    this.props.cat === "資訊"
                      ? item.url
                      : item.secondLevelUrl;

                  return (
                    <div id={tabId} key={item.id} className={listClass}>
                      <a href={url}>{item.title}</a>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div
            className="nav-edit"
            onClick={e => {
              this.showMenuBar(e);
            }}
          >
            <img src={abbrImg} alt="abbr" />
          </div>
        </div>
        <div className={seprateClass} />
      </React.Fragment>
    );
  }
}
export default Navigation;
