import React, { Component } from "react";
import { Link } from "react-router-dom";
import { isMobile } from "react-device-detect";
import qs from "qs";
import MenuBar from "../menubar/menubar";
import { VideoCategory1API, PreTxt } from "../commonConst";
import "./videos.css";
import "../component.css";
import Swiper from "swiper/dist/js/swiper.js";
import "swiper/dist/css/swiper.min.css";
import VideoList from "./videoList/videoList";
import $ from "jquery";
import Navigation from "../navigation-bar/navigation-bar";

class Videos extends Component {
  constructor(props) {
    super(props);

    let selectedCatId = -1;
    let toolbar = "1";
    if (props.match.path === "/cat/video/:id") {
      let qsString = qs.parse(props.location.search.slice(1));
      if (qsString.catid !== null) {
        selectedCatId = parseInt(qsString.catid, 10);
      }
      if (qsString.toolbar !== null) {
        toolbar = qsString.toolbar;
      }
    }
    this.state = {
      cat: "视频",
      topLevelList: [],
      availableList: [],
      loadFinish: {},
      itemClass: {},
      activeTabPosition: 0,
      lastUpdateTime: {},
      lastUpdateCompareTime: {},
      hasUpdated: {},
      menu: "hide",
      selectedCatId: selectedCatId,
      toolbar: toolbar,
      dataReady: false
    };
    this.mounted = false;
  }
  activeItemClass = selectId => {
    let itemClass = {};
    for (let i = 0; i < this.state.topLevelList.length; i++) {
      let id = this.state.topLevelList[i].id;
      if (id === selectId) {
        itemClass[selectId] = "navigation-item active";
      } else {
        itemClass[id] = "navigation-item";
      }
    }

    this.setState({
      itemClass: itemClass
    });
  };
  selectNav = item => {
    this.activeItemClass(item.id);
    let index = this.state.topLevelList.findIndex(x => {
      return x.id === item.id;
    });

    this.setState({
      activeTabPosition: index
    });

    document.title = this.state.topLevelList[index].title;
  };
  setTopLevelUrls = () => {
    let topLevelList = this.state.topLevelList;
    for (let i = 0; i < topLevelList.length; i++) {
      let url = topLevelList[i].url;
      url = url.replace(new RegExp(PreTxt, "g"), "/cat/");
      topLevelList[i].secondLevelUrl = url;
    }
    this.setState({
      topLevelList: topLevelList,
      dataReady: true
    });
  };
  setAvailableLevelUrls = () => {
    let availableList = this.state.availableList;
    for (let i = 0; i < availableList.length; i++) {
      let url = availableList[i].url;
      url = url.replace(new RegExp(PreTxt, "g"), "/cat/");
      availableList[i].secondLevelUrl = url;
    }
    this.setState({
      availableList: availableList
    });
  };

  fetchTopLevelList = () => {
    fetch(VideoCategory1API, { method: "get" })
      .then(result => {
        return result.json();
      })
      .then(data => {
        if (data.code === 1) {
          let topLevelList = [];
          for (let i = 0; i < data.data.rows.length; i++) {
            let foundIndex = this.state.removedList.findIndex(x => {
              return x.id === data.data.rows[i].id;
            });
            if (foundIndex < 0) {
              topLevelList.push(data.data.rows[i]);
            }
          }
          if (this.mounted) {
            this.setState({
              topLevelList: topLevelList,
              availableList: data.data.rows
            });
            if (this.state.selectedCatId >= 0) {
              let foundIndex = data.data.rows.findIndex(x => {
                return x.id === this.state.selectedCatId;
              });
              if (foundIndex >= 0) {
                this.selectNav(data.data.rows[foundIndex]);
              }
            }

            if (this.state.topLevelList.length > 0) {
              document.title = this.state.topLevelList[0].title;
              this.activeItemClass(this.state.topLevelList[0].id);
            }
            // this.saveTopLevelList();
            this.setTopLevelUrls();
            this.setAvailableLevelUrls();
          }
        }
      });
  };

  showMenuBar = () => {
    this.setState({
      menu: "show"
    });
  };

  selectMenu = (item, availableList) => {
    this.setState({
      topLevelList: availableList,
      menu: "hide"
    });
    this.selectNav(item);
    this.saveTopLevelList();
  };
  editMenu = (list, needUpdate) => {
    if (needUpdate) {
      this.setState({
        topLevelList: list,
        menu: "hide"
      });

      this.selectNav(this.state.topLevelList[0]);
    } else {
      this.setState({
        menu: "hide"
      });
    }
  };
  componentWillMount() {
    let parseActivePosition = 0;
    let actPosition = sessionStorage.getItem("activePosition");
    if (actPosition !== null) {
      parseActivePosition = JSON.parse(actPosition);
    }

    let removedList = [];
    let removedListFromStorage = localStorage.getItem("video-removedList");
    if (removedListFromStorage !== null) {
      removedList = JSON.parse(removedListFromStorage);
    }
    this.setState({
      removedList: removedList,
      activeTabPosition: parseActivePosition
    });
  }

  componentDidMount() {
    this.mounted = true;
    if (this.state.topLevelList.length > 0) {
      let activePosition = this.state.activeTabPosition;

      let item = this.state.topLevelList[activePosition];
      this.activeItemClass(item.id);
      document.title = item.title;
      this.selectNav(item);
      this.setTopLevelUrls();
      this.setAvailableLevelUrls();
    } else {
      this.fetchTopLevelList();
    }
    sessionStorage.setItem(
      "activePosition",
      JSON.stringify(this.state.activeTabPosition)
    );
  }
  componentWillUnmount() {
    if (this.tabSwiper) {
      this.tabSwiper.destroy();
    }
    if (this.tabListSwiper) {
      this.tabListSwiper.destroy();
    }
    this.mounted = false;
  }

  componentDidUpdate() {
    if (this.tabListSwiper) {
      this.tabListSwiper.update();
      this.tabListSwiper.slideTo(this.state.activeTabPosition, 0);
    } else if (this.state.dataReady) {
      let topLevelList = this.state.topLevelList;
      this.tabListSwiper = new Swiper("#tabList", {
        pagination: {
          el: ".swiper-pagination",
          clickable: true
        },
        slidesPerView: "auto",
        on: {
          slideChangeTransitionStart: function() {
            let index = this.activeIndex;
            let tabSwiper = document.querySelector(".swiper-container").swiper;
            for (var i = 0; i < topLevelList.length; i++) {
              $("#tab-" + i).removeClass("active");
            }
            $("#tab-" + index).addClass("active");
            if (index >= 3) {
              tabSwiper.slideTo(index - 2, 0);
            } else {
              tabSwiper.slideTo(0, 0);
            }
            document.title = topLevelList[index].title;
            sessionStorage.setItem("activePosition", JSON.stringify(index));
          }
        }
      });
      this.tabListSwiper.update();
      this.tabListSwiper.slideTo(this.state.activeTabPosition, 0);
    }
  }

  render() {
    let navigation, bodyPart, menu;
    if (isMobile) {
      if (this.state.topLevelList.length > 0) {
        menu = (
          <MenuBar
            enableList={this.state.topLevelList}
            availableList={this.state.availableList}
            cat={this.state.cat}
            menu={this.state.menu}
            selectMenu={this.selectMenu}
            editMenuFinish={this.editMenu}
          />
        );
        navigation = (
          <Navigation
            list={this.state.topLevelList}
            activeTabPosition={this.state.activeTabPosition}
            toolbar={this.state.toolbar}
            showMenuBar={this.showMenuBar}
          />
        );
        bodyPart = (
          <div className="video-list-component">
            <div
              className="swiper-container swiper-container-horizontal"
              id="tabList"
            >
              <div className="swiper-wrapper">
                {this.state.topLevelList.map((item, index) => {
                  let active =
                    index === this.state.activeTabPosition ? true : false;
                  return (
                    <div className="swiper-slide" key={index}>
                      <VideoList
                        id={item.id}
                        url={item.url}
                        active={active}
                        key={item.id}
                        update={active}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }
    }
    let titleArea = null;
    if (this.state.toolbar !== "0") {
      titleArea = (
        <div
          className="banner clearfix"
          style={{
            height: "40px",
            paddingTop: "10px",
            backgroundColor: "#efa947"
          }}
        >
          <div className="video-banner-title">
            <div className="return-btn">
              <Link to="/">
                <i className="iconfont" style={{ fontSize: "20px" }}>
                  &#xe66f;
                </i>
              </Link>
            </div>
            <h5>視頻</h5>
          </div>
        </div>
      );
    }
    return (
      <div className="video-top-level">
        {titleArea}
        {menu}

        <div className="video-component">
          {navigation}
          {bodyPart}
        </div>
      </div>
    );
  }
}
export default Videos;
