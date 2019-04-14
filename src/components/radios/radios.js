import React, { Component } from "react";
import { Link } from "react-router-dom";
import { isMobile } from "react-device-detect";
import qs from "qs";
import MenuBar from "../menubar/menubar";
import { RadioCategory1API, PreTxt } from "../commonConst";
import RadioList from "./radioList/radioList";
import $ from "jquery";
import Swiper from "swiper/dist/js/swiper.js";
import "swiper/dist/css/swiper.min.css";
import Navigation from "../navigation-bar/navigation-bar";
import "../videos/videos.css";

class Radios extends Component {
  constructor(props) {
    super(props);
    let selectedCatId = -1;
    let toolbar = "1";
    if (props.match.path === "/cat/radio/:id") {
      let qsString = qs.parse(props.location.search.slice(1));
      if (qsString.catid !== null) {
        selectedCatId = parseInt(qsString.catid, 10);
      }
      if (qsString.toolbar !== null) {
        toolbar = qsString.toolbar;
      }
    }
    this.state = {
      cat: "電臺",
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
        itemClass[selectId] = "navigation-item radio-active";
      } else {
        itemClass[id] = "navigation-item";
      }
    }

    this.setState({
      itemClass: itemClass
    });
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
  selectNav = item => {
    // console.log("select api: ", item);
    this.activeItemClass(item.id);
    let index = this.state.topLevelList.findIndex(x => {
      return x.id === item.id;
    });

    this.setState({
      activeTabPosition: index
    });

    document.title = this.state.topLevelList[index].title;
  };

  fetchTopLevelList = () => {
    fetch(RadioCategory1API, { method: "get" })
      .then(result => {
        return result.json();
      })
      .then(data => {
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
          //this.saveTopLevelList();
          this.setTopLevelUrls();
          this.setAvailableLevelUrls();
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
      //  this.saveTopLevelList();
    } else {
      this.setState({
        menu: "hide"
      });
    }
  };
  componentWillMount() {
    let parseActivePosition = 0;
    let actPosition = sessionStorage.getItem("radioActivePosition");
    if (actPosition !== null) {
      parseActivePosition = JSON.parse(actPosition);
    }
    let removedList = [];
    let removedLsitFromStorage = localStorage.getItem("radio-removedList");
    if (removedLsitFromStorage !== null) {
      removedList = JSON.parse(removedLsitFromStorage);
    }
    this.setState({
      removedList: removedList,
      activeTabPosition: parseActivePosition
    });
  }
  componentDidMount() {
    this.mounted = true;
    this.fetchTopLevelList();
    sessionStorage.setItem(
      "radioActivePosition",
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
      //console.log("data ready");
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
            sessionStorage.setItem(
              "radioActivePosition",
              JSON.stringify(index)
            );
          }
        }
      });
      this.tabListSwiper.update();
      this.tabListSwiper.slideTo(this.state.activeTabPosition, 0);
    }
  }
  render() {
    //  console.log(this.state);
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
                      <RadioList
                        id={item.id}
                        key={item.id}
                        url={item.url}
                        active={active}
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
            backgroundColor: "#8fbd1d"
          }}
        >
          <div className="radio-banner-title">
            <div className="return-btn">
              <Link to="/">
                <i className="iconfont" style={{ fontSize: "20px" }}>
                  &#xe66f;
                </i>
              </Link>
            </div>
            <h5>電臺</h5>
          </div>
        </div>
      );
    }
    return (
      <div className="radio-top-level">
        {titleArea}
        {menu}
        {navigation}
        <div className="radio-component">{bodyPart}</div>
      </div>
    );
  }
}

export default Radios;
