import React, { Component } from "react";
import "../../component.css";
import loadingImg from "../../image/loading.gif";

class FavoriteList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      list: [],
      selectedList: [],
      mode: this.props.mode,
      selectAll: false
    };
  }
  selectItem = index => {
    let list = [...this.state.list];
    let selectedList = [...this.state.selectedList];
    list[index].selected = !list[index].selected;
    if (list[index].selected) {
      selectedList.push(this.state.list[index]);
    } else {
      let foundIndex = selectedList.findIndex(x => {
        return x.id === list[index].id;
      });
      if (foundIndex >= 0) {
        selectedList.splice(foundIndex, 1);
      }
    }
    let selectAll = list.length === selectedList.length ? true : false;

    this.setState({
      selectedList: selectedList,
      selectAll: selectAll
    });
  };
  selectAll = () => {
    let chooseAll = !this.state.selectAll;
    let list = [...this.state.list];
    let selectedList = this.state.selectedList;
    if (chooseAll) {
      selectedList = list;
    } else {
      selectedList = [];
    }
    this.setState({
      selectedList: selectedList,
      chooseAll: chooseAll
    });
  };
  deleteItem = () => {
    let list = [...this.state.list];
    let selectedList = [...this.state.selectedList];
    if (selectedList.length == 0) {
      this.setState({});
    }
    for (let i = selectedList.length - 1; i >= 0; i--) {
      let foundIndex = list.findIndex(x => {
        return x.id === selectedList[i].id;
      });
      list.slice(foundIndex, 1);
      selectedList.slice(i, 1);
    }
    this.setState({
      list: list,
      selectedList: selectedList
    });
    localStorage.setItem(this.props.cat + "-fav-list", JSON.stringify(list));
  };
  componentDidMount() {
    let storageName = this.props.cat + "-fav-list";
    let favorList = localStorage.getItem(storageName);
    let list = favorList === null ? [] : JSON.parse(favorList);
    if (list.length > 0) {
      list = list.reverse();
      for (let i = 0; i < list.length; i++) {
        list[i].selected = false;
      }
    }
    this.setState({
      list: list
    });
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.mode !== this.state.mode) {
      this.setState({
        mode: nextProps.mode
      });
    }
  }
  render() {
    let items = this.state.list.map((item, index) => {
      let itemClass =
        this.state.mode === "edit"
          ? "favorite-item-show-select"
          : "favorite-item-no-select";
      let bodyPart = (
        <div className={itemClass}>
          <div className="favorite-item-image">
            <img src={item.picture} alt="item-image" />
          </div>
          <div className="favorite-item-info">
            <p className="line-clamp-2">{item.title}</p>
            <p className="favorite-item-date">{item.date}</p>
          </div>
        </div>
      );

      if (this.state.mode === "edit") {
        let select;
        let foundIndex = this.state.selectedList.findIndex(X => {
          return x.id === item.id;
        });
        if (foundIndex >= 0) {
          select = (
            <span className="item-check">
              <i className="fas fa-check" />
            </span>
          );
        } else {
          select = <span className="item-uncheck" />;
        }
        let checkBox = <div className="item-select-area">{select}</div>;
        return (
          <div
            classNanme="favorite-list-item"
            onClick={() => {
              this.selectItem(index);
            }}
          >
            {checkBox}
            {bodyPart}
          </div>
        );
      } else {
        return (
          <a classNanme="favorite-list-item" href={item.url}>
            {bodyPart}
          </a>
        );
      }
    });
    let editMenu;
    if (this.state.mode === "edit") {
      let selectTxt = this.state.selectAll ? "取消全選" : "全選";
      let amount = this.state.selectedList.length.toString();
      let deleteTxt = "刪除" + amount;
      editMenu = (
        <div className="favoreit-edit-menu">
          <div className="favorite-select-menu">{selectTxt}</div>
          <div className="favorite-delete-menu">{deleteTxt}</div>
        </div>
      );
    }
    return (
      <div className="favorite-item-list">
        {items}
        {editMenu}
      </div>
    );
  }
}
export default FavoriteList;
