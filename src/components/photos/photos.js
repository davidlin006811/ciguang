import React, { Component } from "react";
import { isMobile } from "react-device-detect";
import { Link } from "react-router-dom";
import { PhotoCategory1API, PreTxt } from "../commonConst";
import qs from "qs";
import MenuBar from "../menubar/menubar";
import Swiper from "swiper";
import $ from "jquery";
import Navigation from "../navigation-bar/navigation-bar";
import PhotoList from "./photoList/photoList";
import AlbumList from "./albumList/albumList";
import "../videos/videos.css";
import "./photos.css";

class Photos extends Component {
  constructor(props) {
    super(props);
    let selectedCatId = -1;
    let toolbar = "1";
    if (props.match.path === "/cat/photo/:id") {
      let qsString = qs.parse(props.location.search.slice(1));
      if (qsString.catid !== null) {
        selectedCatId = parseInt(qsString.catid, 10);
      }
      if (qsString.toolbar !== null) {
        toolbar = qsString.toolbar;
      }
    }
    this.state = {
      cat: "图集",
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
      toolbar: toolbar
    };
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
      topLevelList: topLevelList
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
  saveTopLevelList = () => {
    let topLevelList = JSON.stringify(this.state.topLevelList);
    let availableList = JSON.stringify(this.state.availableList);
    localStorage.setItem("photoTopLevelList", topLevelList);
    localStorage.setItem("photoAvailableTopLevelList", availableList);
  };
  fetchTopLevelList = () => {
    fetch(PhotoCategory1API, { method: "get" })
      .then(result => {
        return result.json();
      })
      .then(data => {
        if (data.code === 1) {
          // console.log(data);
          this.setState({
            topLevelList: data.data.row,
            availableList: data.data.row
          });
          if (this.state.selectedCatId >= 0) {
            let foundIndex = data.data.row.findIndex(x => {
              return x.id === this.state.selectedCatId;
            });
            if (foundIndex >= 0) {
              this.selectNav(data.data.row[foundIndex]);
            }
          }

          if (this.state.topLevelList.length > 0) {
            document.title = this.state.topLevelList[0].title;
            this.activeItemClass(this.state.topLevelList[0].id);
          }
          this.saveTopLevelList();
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
      this.saveTopLevelList();
    } else {
      this.setState({
        menu: "hide"
      });
    }
  };

  componentWillMount() {
    let topLevelList = localStorage.getItem("photoTopLevelList");
    let photoAvailableTopLevelList = localStorage.getItem(
      "photoAvailableTopLevelList"
    );

    let parseTopLevelList = [];
    let parseAvailableLevelList = [];
    let parseActivePosition = 0;
    if (topLevelList != null) {
      parseTopLevelList = JSON.parse(topLevelList);
    }
    if (photoAvailableTopLevelList != null) {
      parseAvailableLevelList = JSON.parse(photoAvailableTopLevelList);
    }
    if (this.state.selectedCatId >= 0) {
      if (parseTopLevelList.length > 0) {
        let foundIndex = parseTopLevelList.findIndex(x => {
          return x.id === this.state.selectedCatId;
        });
        if (foundIndex >= 0) {
          parseActivePosition = foundIndex;
        }
      }
    } else {
      let actPosition = sessionStorage.getItem("activePhotoPosition");
      if (actPosition !== null) {
        parseActivePosition = JSON.parse(actPosition);
      }
    }

    this.setState({
      topLevelList: parseTopLevelList,
      availableList: parseAvailableLevelList,
      activeTabPosition: parseActivePosition
    });
    //console.log(this.state);
  }

  componentDidMount() {
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
      "activePhotoPosition",
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
  }
  componentDidUpdate() {
    if (this.tabListSwiper) {
      this.tabListSwiper.update();
      this.tabListSwiper.slideTo(this.state.activeTabPosition, 0);
    } else {
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
              "activePhotoPosition",
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
    //console.log(this.state);
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
          <div className="photo-list-component">
            <div
              className="swiper-container swiper-container-horizontal"
              id="tabList"
            >
              <div className="swiper-wrapper">
                {this.state.topLevelList.map((item, index) => {
                  let active =
                    index === this.state.activeTabPosition ? true : false;
                  if (item.type === "pic") {
                    return (
                      <div className="swiper-slide" key={index}>
                        <PhotoList
                          id={item.id}
                          url={item.url}
                          active={active}
                          key={item.id}
                          update={active}
                        />
                      </div>
                    );
                  } else {
                    return (
                      <div className="swiper-slide" key={index}>
                        <AlbumList
                          id={item.id}
                          url={item.url}
                          active={active}
                          key={item.id}
                          update={active}
                        />
                      </div>
                    );
                  }
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
            height: "40px"
          }}
        >
          <div className="photo-banner-title">
            <div className="return-btn">
              <Link to="/">
                <i className="iconfont" style={{ fontSize: "20px" }}>
                  &#xe66f;
                </i>
              </Link>
            </div>
            <h5>图集</h5>
          </div>
        </div>
      );
    }
    return (
      <div className="photo-top-level">
        {titleArea}
        {menu}
        {navigation}
        <div className="photo-component">{bodyPart}</div>
      </div>
    );
  }
}
export default Photos;
