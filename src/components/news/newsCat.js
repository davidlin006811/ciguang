import React, { PureComponent } from "react";
import NewsList from "./newsList/newsList";
import qs from "qs";
import MenuBar from "../menubar/menubar";
//import Swiper from "swiper";
import Swiper from "swiper/dist/js/swiper.js";
import "swiper/dist/css/swiper.min.css";
import $ from "jquery";
import Navigation from "../navigation-bar/navigation-bar";
import TabMenu from "../tabMenu/tabMenu";
import { NewsCatAPI, PreTxt } from "../commonConst";
import "../component.css";
import "../videos/videos.css";
import "./newsCat.css";

class NewsCat extends PureComponent {
  constructor(props) {
    super(props);
    this.cat = "資訊";
    let selectedModel = "";
    let toolbar = "1";
    let showBottomMenu = false;
    if (props.match !== undefined && props.match.path === "/cat/news/:id") {
      let qsString = qs.parse(props.location.search.slice(1));
      if (qsString.model !== null) {
        selectedModel = qsString.model;
      }
      if (qsString.toolbar !== null) {
        toolbar = qsString.toolbar;
      }
    }
    if (props.match !== undefined) {
      showBottomMenu = true;
    }
    this.state = {
      topLevelList: [],
      availableList: [],
      removedList: [],
      loadFinish: {},
      itemClass: {},
      activeTabPosition: 0,
      lastUpdateTime: {},
      lastUpdateCompareTime: {},
      hasUpdated: {},
      menu: "hide",
      selectedModel: selectedModel,
      toolbar: toolbar,
      showBottomMenu: showBottomMenu,
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
    document.title = this.state.topLevelList[index].tab_title;
  };
  setTopLevelUrls = () => {
    let topLevelList = this.state.topLevelList;
    for (let i = 0; i < topLevelList.length; i++) {
      let url = topLevelList[i].url;
      url = url.replace(new RegExp(PreTxt, "g"), "/cat/");
      topLevelList[i].url = url;
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
      availableList[i].url = url;
    }
    this.setState({
      availableList: availableList
    });
  };

  fetchTopLevelList = () => {
    fetch(NewsCatAPI)
      .then(result => {
        return result.json();
      })
      .then(data => {
        // console.log(data);
        if (data.code === 1) {
          let topLevelList = [];
          for (let i = 0; i < data.data.rows.length; i++) {
            data.data.rows[i].title = data.data.rows[i].tab_title;
            data.data.rows[i].url = data.data.rows[i].url.replace(
              new RegExp("ios", "g"),
              "h5"
            );
            //移除在removedList的元素
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
            if (this.state.selectedModel !== "") {
              let foundIndex = data.data.rows.findIndex(x => {
                return x.model === this.state.selectedModel;
              });
              if (foundIndex >= 0) {
                this.selectNav(data.data.rows[foundIndex]);
              }
            } else if (this.state.topLevelList.length > 0) {
              document.title = this.state.topLevelList[0].tab_title;
              this.activeItemClass(this.state.topLevelList[0].id);
            }
            //this.saveTopLevelList(data.data.rows, data.data.rows);
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
      //this.saveTopLevelList();
    } else {
      this.setState({
        menu: "hide"
      });
    }
  };
  componentWillMount() {
    let parseActivePosition = 0;
    let actPosition = sessionStorage.getItem("news-activePosition");
    if (actPosition !== null) {
      parseActivePosition = JSON.parse(actPosition);
    }
    let removedList = [];
    let removedListFromStorage = localStorage.getItem("news-removedList");
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
    this.fetchTopLevelList();

    sessionStorage.setItem(
      "news-activePosition",
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
            sessionStorage.setItem(
              "news-activePosition",
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
    let navigation, bodyPart, menu, bottomMenu;
    if (this.state.topLevelList.length > 0) {
      menu = (
        <MenuBar
          enableList={this.state.topLevelList}
          availableList={this.state.availableList}
          cat={this.cat}
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
          cat={this.cat}
        />
      );
      if (this.state.dataReady) {
        bodyPart = (
          <div className="news-list-component">
            <div
              className="swiper-container swiper-container-horizontal"
              id="tabList"
            >
              <div className="swiper-wrapper">
                {this.state.topLevelList.map((item, index) => {
                  // console.log(item);
                  let active =
                    index === this.state.activeTabPosition ? true : false;
                  return (
                    <div className="swiper-slide" key={index}>
                      <NewsList
                        id={item.id}
                        api={item.url}
                        key={item.id}
                        update={active}
                        model={item.model}
                        tabTitle={item.tab_title}
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
            color: "white",
            backgroundColor: "#b6885d",
            textAlign: "center"
          }}
        >
          <h5>{this.cat}</h5>
        </div>
      );
    }
    if (this.state.showBottomMenu) {
      bottomMenu = <TabMenu role="info" />;
    }
    return (
      <div className="news-top-level">
        {titleArea}
        {menu}

        {navigation}
        {bodyPart}

        {bottomMenu}
      </div>
    );
  }
}

export default NewsCat;
