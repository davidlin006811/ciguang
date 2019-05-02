import React, { Component } from "react";
//import { isMobile } from "react-device-detect";
import { Link } from "react-router-dom";
import qs from "qs";
import {
  DefaultEssenceListAPT,
  EssenceCategoryAPI,
  EssenceTagAPI,
  PreTxt
} from "../commonConst";
import { removeUrlAmp } from "../commonFunctions";
import EssenceList from "./essence-list/essence_list"; //引入精华列表组件
import errorImg from "../image/sorry.jpg";
import "./essence.css";
import "../component.css";
//import "./essence.css";
class Essence extends Component {
  constructor(props) {
    super(props);
    //console.log(props);
    let api = DefaultEssenceListAPT;
    let qsString = qs.parse(removeUrlAmp(props.location.search).slice(1));
    let catId = "";
    let tagId = "標簽";
    let toolbar = "1";
    if (props.match.path === "/cat/essence/:id") {
      api = PreTxt + "essence/infolist" + props.location.search;
      catId = qsString.key;

      //console.log(qsString);
    } else if (props.match.path === "/tag/essence/:id") {
      api = PreTxt + "essence/infolist" + props.location.search;
      tagId = qsString.key;
    }
    if (typeof qsString.toolbar !== "undefined") {
      toolbar = qsString.toolbar;
    }
    this.state = {
      api: api,
      categoryName: "列表",
      tagName: tagId,
      catId: catId,
      catSelected: false,
      tagSelected: false,
      catList: [],
      tagList: [],
      toolbar: toolbar
    };
  }
  //获取列表函数
  fetchCat = () => {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", EssenceCategoryAPI, true);
    xhr.onload = function(e) {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          let json_obj = JSON.parse(xhr.responseText);
          //console.log(json_obj);
          json_obj.data.rows.forEach(x => {
            //console.log(x.url);
            x.url = x.url.replace(new RegExp("client=h5", "g"), "client=web");
            x.url = x.url.replace(new RegExp(PreTxt, "g"), "/cat/");
          });
          let categoryName = "列表";
          if (this.state.catId !== "") {
            let catId = parseInt(this.state.catId, 10);
            let foundIndex = json_obj.data.rows.findIndex(x => {
              return x.id === catId;
            });
            if (foundIndex >= 0) {
              categoryName = json_obj.data.rows[foundIndex].title;
            }
          }
          this.setState({
            categoryName: categoryName,
            catList: json_obj.data.rows
          });
        } else {
          console.error(xhr.statusText);
        }
      }
    }.bind(this);
    xhr.onerror = function(e) {
      console.error(xhr.statusText);
    };
    xhr.send(null);
  };
  //获取标签函数
  fetchTag = () => {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", EssenceTagAPI, true);
    xhr.onload = function(e) {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          let json_obj = JSON.parse(xhr.responseText);
          json_obj.data.rows.forEach(x => {
            x.url = x.url.replace(new RegExp("client=h5", "g"), "client=web");
            x.url = x.url.replace(new RegExp(PreTxt, "g"), "/tag/");
          });

          this.setState({
            tagList: json_obj.data.rows
          });
        } else {
          console.error(xhr.statusText);
        }
      }
    }.bind(this);
    xhr.onerror = function(e) {
      console.error(xhr.statusText);
    };
    xhr.send(null);
  };

  //打开列表
  openCat = () => {
    let catSel = !this.state.catSelected;
    this.setState({
      catSelected: catSel,
      tagSelected: false
    });
  };
  //打开标签
  openTag = () => {
    let tagSel = !this.state.tagSelected;
    this.setState({
      tagSelected: tagSel,
      catSelected: false
    });
  };
  selectCatItem = item => {
    this.setState({
      catSelected: false
    });
    this.props.history.push(item.url);
    setTimeout(() => {
      this.getDataFromUrl();
    }, 300);
  };
  selectTagItem = item => {
    this.setState({
      tagSelected: false
    });
    this.props.history.push(item.url);
    setTimeout(() => {
      this.getDataFromUrl();
    }, 300);
  };
  getDataFromUrl = () => {
    let api = DefaultEssenceListAPT;
    //console.log(this.props);
    let qsString = qs.parse(removeUrlAmp(this.props.location.search).slice(1));
    let catId = "";
    let tagId = "標簽";
    let categoryName = "列表";
    if (this.props.match.path === "/cat/essence/:id") {
      api = PreTxt + "essence/infolist" + this.props.location.search;
      let foundIndex = this.state.catList.findIndex(x => {
        return x.id === parseInt(qsString.key, 10);
      });
      catId = qsString.key;
      categoryName =
        foundIndex >= 0 ? this.state.catList[foundIndex].title : "列表";

      //console.log(qsString);
    } else if (this.props.match.path === "/tag/essence/:id") {
      api = PreTxt + "essence/infolist" + this.props.location.search;
      tagId = qsString.key;
    }
    this.setState({
      api: api,
      tagName: tagId,
      categoryName: categoryName,
      catId: catId
    });
  };
  componentWillMount() {
    //获取列表
    this.fetchCat();
    //获取标签
    this.fetchTag();
  }
  componentDidMount() {
    //从sessionStorage获取当前的文章列表API， 列表名和标签名
    let data = JSON.parse(sessionStorage.getItem("data"));
    if (data != null) {
      this.setState({
        api: data.api,
        categoryName: data.categoryName,
        tagName: data.tagName
      });
      if (data.categoryName !== "列表") {
        document.title = data.categoryName;
      } else if (data.tagName !== "標簽") {
        document.title = data.tagName;
      }
    } else {
      document.title = "精華";
    }
  }

  render() {
    //console.log(this.state);
    let catDisplay, tagDisplay, listDisplay, catMenu, tagMenu;

    //显示列表
    if (this.state.catSelected) {
      let catClass =
        this.state.toolbar === "0"
          ? "categroy-body no-cat-margin"
          : "categroy-body";
      catDisplay = (
        <div className={catClass}>
          <ul>
            {this.state.catList.map(item => {
              let title = item.title;
              if (title.length > 21) {
                title = title.substring(0, 21) + "...";
              }
              return (
                <li key={item.id} className="categroy-list">
                  <p
                    href={item.url}
                    className="cat-list-link"
                    onClick={() => {
                      this.selectCatItem(item);
                    }}
                  >
                    {title}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      );

      catMenu = (
        <button
          onClick={() => this.openCat()}
          style={{ backgroundColor: "white", color: "#00a9c7" }}
        >
          {this.state.categoryName}
          <i className="iconfont" style={{ color: "#00a9c7" }}>
            &#xe6b4;
          </i>
        </button>
      );
    } else {
      catMenu = (
        <button
          onClick={() => this.openCat()}
          style={{ backgroundColor: "white" }}
        >
          {this.state.categoryName}
          <i
            className="iconfont"
            style={{
              fontSize: "18px",
              color: "#bbb",
              paddingLeft: "5px"
            }}
          >
            &#xe6a4;
          </i>
        </button>
      );
    }
    //显示标签
    if (this.state.tagSelected) {
      let tagClass =
        this.state.toolbar === "0" ? "tag-body no-tag-margin" : "tag-body";
      tagDisplay = (
        <div className={tagClass}>
          {this.state.tagList.map(item => (
            <div key={item.id} className="tag-list">
              <p
                href={item.url}
                className="tag-list-link"
                onClick={() => {
                  this.selectTagItem(item);
                }}
              >
                {item.title}
              </p>
            </div>
          ))}
        </div>
      );
      tagMenu = (
        <button
          onClick={() => this.openTag()}
          style={{ backgroundColor: "white", color: "#00a9c7" }}
        >
          {this.state.tagName}
          <i
            className="iconfont"
            style={{
              fontSize: "18px",
              color: "#00a9c7",
              paddingLeft: "5px"
            }}
          >
            &#xe6b4;
          </i>
        </button>
      );
    } else {
      tagMenu = (
        <button
          onClick={() => this.openTag()}
          style={{ backgroundColor: "white" }}
        >
          {this.state.tagName}
          <i
            className="iconfont"
            style={{
              fontSize: "18px",
              color: "#bbb",
              paddingLeft: "5px"
            }}
          >
            &#xe6a4;
          </i>
        </button>
      );
    }
    //显示文章列表
    if (!this.state.catSelected && !this.state.tagSelected) {
      listDisplay = (
        <EssenceList
          api={this.state.api}
          sort="no_sort"
          toolbar={this.state.toolbar}
        />
      );
    }
    //是否显示顶部
    let titleArea = null;
    if (this.state.toolbar !== "0") {
      titleArea = (
        <div className="banner-title">
          <div className="return-btn">
            <Link to="/">
              <i
                className="iconfont"
                style={{ fontSize: "20px", fontWeight: "700" }}
              >
                &#xe66f;
              </i>
            </Link>
          </div>
          <h5>精華</h5>
        </div>
      );
    }
    return (
      <div className="essences-component">
        <div className="banner clearfix">
          {titleArea}
          <div className="banner-nav">
            <div className="nav-tag" style={{ borderRight: "1px solid #bbb" }}>
              {catMenu}
            </div>
            <div className="nav-tag">{tagMenu}</div>
          </div>
        </div>
        {catDisplay}
        {tagDisplay}
        <div className="seperate-div" />
        {listDisplay}
      </div>
    );
  }
}
export default Essence;
