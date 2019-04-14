import React, { Component } from "react";
import { SearchHotKeyWordsAPI, SearchCatAPI } from "../../commonConst";
import SearchResultList from "../searchList/searchList";
//import Swiper from "swiper";
import Swiper from "swiper/dist/js/swiper.js";
import "swiper/dist/css/swiper.min.css";
import $ from "jquery";
import SearchMenu from "../searchMenu/searchMenu";
import "./search.css";
import "../../news/newsCat.css";
import deleteImg from "../../image/delete.svg";

class Search extends Component {
  constructor(props) {
    super(props);
    this.state = {
      keyWordList: [],
      catList: [],
      serachUrlList: [],
      keyWord: "",
      placeHolder: "热搜关键字",
      displayMode: "keyword",
      activeTabPosition: 0,
      update: false,
      dataReady: false,
      count: 0
    };
    this.tabListSwiper = null;
    this.mounted = false;
  }

  fetchKeywordList = () => {
    fetch(SearchHotKeyWordsAPI)
      .then(result => {
        return result.json();
      })
      .then(data => {
        if (this.mounted) {
          this.setState({
            keyWordList: data.data.rows
          });
        }
      });
  };
  fetchCatList = () => {
    fetch(SearchCatAPI)
      .then(result => {
        return result.json();
      })
      .then(data => {
        if (this.mounted) {
          this.setState({ catList: data.data.rows, dataReady: true });
        }
      });
  };

  searchWithHotKeyword = keyword => {
    let currentPosition = 0;
    let currentActiveIndex = sessionStorage.getItem("search-activePosition");
    if (currentActiveIndex !== null) {
      currentPosition = JSON.parse(currentActiveIndex);
    }

    this.setState({
      keyWord: keyword,
      activeTabPosition: currentPosition,
      displayMode: "result"
    });
    sessionStorage.setItem("search-keyword", JSON.stringify(keyword));
    sessionStorage.setItem("search-mode", JSON.stringify("result"));
  };
  searchWithKeyword = () => {
    let keyword = this.state.keyWord;
    if (keyword === "") {
      return;
    }
    let currentPosition = 0;
    let currentActiveIndex = sessionStorage.getItem("search-activePosition");
    if (currentActiveIndex !== null) {
      currentPosition = JSON.parse(currentActiveIndex);
    }

    this.setState({
      activeTabPosition: currentPosition,
      displayMode: "result",
      count: this.state.count + 1
    });
    sessionStorage.setItem(
      "search-keyword",
      JSON.stringify(this.state.keyWord)
    );
    sessionStorage.setItem("search-mode", JSON.stringify("result"));
  };

  removeAllTxt = () => {
    this.setState({
      keyWord: "",
      displayMode: "keyword",
      count: 0
    });
    sessionStorage.setItem("search-keyword", JSON.stringify(""));
    sessionStorage.setItem("search-mode", JSON.stringify("keyword"));
  };
  handleChange = event => {
    let displayMode = this.state.displayMode;
    let count = this.state.count;
    if (event.target.value === "") {
      displayMode = "keyword";
      count = 0;
      sessionStorage.setItem("search-mode", JSON.stringify("keyword"));
    }
    let activePosition = JSON.parse(
      sessionStorage.getItem("search-activePosition")
    );
    this.setState({
      keyWord: event.target.value,
      displayMode: displayMode,
      count: count,
      activeTabPosition: activePosition
    });
  };
  selectMenu = index => {
    this.setState({
      activeTabPosition: index
    });
    sessionStorage.setItem("search-activePosition", JSON.stringify(index));
  };
  resetSearchStatus = () => {
    sessionStorage.removeItem("search-mode");
    sessionStorage.removeItem("search-keyword");
    sessionStorage.removeItem("search-activePosition");
  };
  goBack = () => {
    this.resetSearchStatus();
    this.props.history.goBack();
  };
  componentWillMount() {
    let searchMode = "keyword";
    let searchKeyWord = "";
    let activePosition = 0;
    let searchModeFromStorage = sessionStorage.getItem("search-mode");
    let keywordFromStorage = sessionStorage.getItem("search-keyword");
    let activePositionFromStorage = sessionStorage.getItem(
      "search-activePosition"
    );
    if (searchModeFromStorage !== null) {
      searchMode = JSON.parse(searchModeFromStorage);
    }
    if (keywordFromStorage !== null) {
      searchKeyWord = JSON.parse(keywordFromStorage);
    }
    if (activePositionFromStorage !== null) {
      activePosition = JSON.parse(activePositionFromStorage);
    } else {
      sessionStorage.setItem(
        "search-activePosition",
        JSON.parse(activePosition)
      );
    }
    this.setState({
      displayMode: searchMode,
      keyWord: searchKeyWord,
      activeTabPosition: activePosition
    });
  }
  componentDidMount() {
    this.mounted = true;
    this.fetchKeywordList();
    this.fetchCatList();
  }

  componentWillUnmount() {
    if (this.tabListSwiper) {
      this.tabListSwiper.destroy();
    }
    this.mounted = false;
  }
  componentDidUpdate() {
    if (this.state.displayMode === "keyword" && this.tabListSwiper !== null) {
      this.tabListSwiper.destroy();
      this.tabListSwiper = null;
    }
    if (this.tabListSwiper !== null) {
      if (this.state.displayMode === "result") {
        this.tabListSwiper.update();
        this.tabListSwiper.slideTo(this.state.activeTabPosition, 0);
      }
    } else if (this.state.dataReady) {
      let topLevelList = this.state.catList;

      if (this.state.displayMode === "result") {
        this.tabListSwiper = new Swiper("#tabList", {
          pagination: {
            el: ".swiper-pagination",
            clickable: true
          },
          slidesPerView: "auto",
          on: {
            slideChangeTransitionStart: function() {
              let index = this.activeIndex;

              for (var i = 0; i < topLevelList.length; i++) {
                $("#tab-" + i).removeClass("active");
              }
              $("#tab-" + index).addClass("active");

              document.title = topLevelList[index].modelname;
              sessionStorage.setItem(
                "search-activePosition",
                JSON.stringify(index)
              );
            }
          }
        });
        this.tabListSwiper.update();
        this.tabListSwiper.slideTo(this.state.activeTabPosition, 0);
      }
    }
  }

  render() {
    let body;
    let keyWordList = this.state.keyWordList.map((item, index) => {
      let keywordClass =
        index + 1 <= 3 ? "keyword-index highlight" : "keyword-index";
      return (
        <li
          key={item.id}
          className="keyword-item"
          onClick={() => {
            this.searchWithHotKeyword(item.keywords);
          }}
        >
          <span className={keywordClass}>{index + 1}</span>
          {item.keywords}
        </li>
      );
    });
    if (this.state.displayMode === "keyword") {
      body = (
        <div className="search-list">
          <ul>{keyWordList}</ul>
        </div>
      );
    } else if (this.state.displayMode === "result") {
      let list = this.state.catList.map((item, index) => {
        let url = item.url + "&keywords=" + this.state.keyWord;

        return (
          <div className="swiper-slide" key={index}>
            <SearchResultList
              api={url}
              update={this.state.update}
              key={item.id}
              id={item.id}
              count={this.state.count}
            />
          </div>
        );
      });
      body = (
        <div>
          <SearchMenu
            list={this.state.catList}
            activeTabPosition={this.state.activeTabPosition}
            selectMenu={this.selectMenu}
          />
          <div className="search-reuslt-component ">
            <div
              className="swiper-container swiper-container-horizontal"
              id="tabList"
            >
              <div className="swiper-wrapper">{list}</div>
            </div>
          </div>
        </div>
      );
    }
    let deleteTxt;
    if (this.state.keyWord !== "") {
      deleteTxt = (
        <img
          className="delete-icon"
          src={deleteImg}
          alt="delete"
          onClick={this.removeAllTxt}
        />
      );
    }
    return (
      <div className="search-component">
        <div className="search-title-bar">
          <div className="go-back">
            <i
              className="fas fa-chevron-left"
              style={{ fontSize: "20px" }}
              onClick={this.goBack}
            />
          </div>
          <div className="search-field">
            <i className="fas fa-search" />
            <input
              placeholder={this.state.placeHolder}
              value={this.state.keyWord}
              onChange={e => {
                this.handleChange(e);
              }}
            />
            {deleteTxt}
          </div>
          <div className="search-btn">
            <button onClick={this.searchWithKeyword}>搜索</button>
          </div>
        </div>
        {body}
      </div>
    );
  }
}
export default Search;
