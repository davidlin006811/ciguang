import React, { Component } from "react";
import "./menubar.css";
import deleteImg from "../image/delete.svg";
import "../component.css";
class MenuBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      enableList: this.props.enableList,
      availableList: this.props.availableList,
      disableList: [],
      catClass: "",
      editMode: false,
      headerClass: "",
      headerTitle: "菜單",
      needUpdate: false
    };
  }

  switchMode = () => {
    let editMode = !this.state.editMode;
    this.setState({
      editMode: editMode
    });
  };
  //退出菜单
  exitMenuBar = () => {
    //退出编辑菜单，并返回修改后的在用列表

    if (this.props.cat === "資訊") {
      localStorage.setItem(
        "news-removedList",
        JSON.stringify(this.state.disableList)
      );
    } else if (this.props.cat === "视频") {
      localStorage.setItem(
        "video-removedList",
        JSON.stringify(this.state.disableList)
      );
    } else if (this.props.cat === "電臺") {
      localStorage.setItem(
        "radio-removedList",
        JSON.stringify(this.state.disableList)
      );
    } else if (this.props.cat === "图集") {
      localStorage.setItem(
        "photo-removedList",
        JSON.stringify(this.state.disableList)
      );
    }

    this.props.editMenuFinish(this.state.enableList, this.state.needUpdate);
  };
  //选择菜单
  selectMenu = item => {
    this.props.selectMenu(item, this.state.enableList);
  };
  //从正在用的列表里移除所选项， 并添加到备选列表里
  removeItemFromEnableList = item => {
    if (this.state.enableList.length === 1) {
      return;
    } else {
      let disableList = this.state.disableList;
      let enableList = this.state.enableList;
      disableList.push(item);
      let index = enableList.findIndex(x => {
        return x.id === item.id;
      });
      if (index >= 0) {
        enableList.splice(index, 1);
        this.setState({
          enableList: enableList,
          disableList: disableList,
          needUpdate: true
        });
      }
    }
  };
  //从备选列表里移除所选项， 并添加到在用列表里
  addItemToEnableList = item => {
    if (this.state.disableList.length === 0) {
      return;
    } else {
      let disableList = this.state.disableList;
      let enableList = this.state.enableList;
      enableList.push(item);
      let index = disableList.findIndex(x => {
        return x.id === item.id;
      });
      if (index >= 0) {
        disableList.splice(index, 1);
        this.setState({
          enableList: enableList,
          disableList: disableList,
          needUpdate: true
        });
      }
    }
  };
  //处理在用列表里所选项的点击事件
  handleEnableItem = item => {
    if (!this.state.editMode) {
      this.selectMenu(item);
    } else {
      this.removeItemFromEnableList(item);
    }
  };

  componentDidMount() {
    document.title = this.props.cat;
    let catClass = "";
    switch (this.props.cat) {
      case "视频":
        catClass = "cat-video";
        break;
      case "電臺":
        catClass = "cat-radio";
        break;
      case "图集":
        catClass = "cat-photo";
        break;
      case "資訊":
        catClass = "cat-news";
        break;
      default:
        catClass = "cat-news";
    }
    let headerClass = "menu-header " + catClass;
    let headerTitle = this.props.cat + this.state.headerTitle;
    let disableList = [];
    for (let i = 0; i < this.state.availableList.length; i++) {
      let id = this.state.availableList[i].id;
      let foundIndex = this.state.enableList.findIndex(x => {
        return x.id === id;
      });
      if (foundIndex < 0) {
        disableList.push(this.state.availableList[i]);
      }
    }
    this.setState({
      disableList: disableList,
      headerClass: headerClass,
      headerTitle: headerTitle,
      catClass: catClass
    });
  }
  render() {
    let buttonTxt = this.state.editMode === false ? "编辑" : "完成";
    let editLabel, disableCat;
    //是否显示删除符号
    if (this.state.editMode) {
      editLabel = (
        <img src={deleteImg} className="delete-label" alt="delete-label" />
      );
    } else {
      editLabel = null;
    }
    ////我的栏目按钮显示文字
    if (this.state.disableList.length > 0) {
      disableCat = (
        <div className="disable-menu-list">
          <div>添加更多栏目</div>
          {this.state.disableList.map((item, id) => {
            return (
              <div className="menu-item" key={id}>
                <button
                  onClick={() => {
                    this.addItemToEnableList(item);
                  }}
                >
                  {item.title}
                </button>
              </div>
            );
          })}
        </div>
      );
    } else {
      disableCat = null;
    }

    return (
      <div className={this.props.menu} id="menuBarEditor">
        <div className={this.state.headerClass}>
          <button
            className={this.state.catClass}
            onClick={() => {
              this.exitMenuBar();
            }}
          >
            <i className="iconfont" style={{ fontSize: "20px" }}>
              &#xe66f;
            </i>
          </button>
          <h5>{this.state.headerTitle}</h5>
        </div>
        <div className="my-cat clearfix">
          <div>我的栏目</div>
          <button
            onClick={() => {
              this.switchMode();
            }}
          >
            {buttonTxt}
          </button>
        </div>
        <div className="enable-menu-list clearfix">
          {this.state.enableList.map((item, index) => {
            return (
              <div className="menu-item" key={index}>
                {editLabel}
                <button
                  onClick={() => {
                    this.handleEnableItem(item);
                  }}
                >
                  {item.title}
                </button>
              </div>
            );
          })}
        </div>
        {disableCat}
      </div>
    );
  }
}
export default MenuBar;
