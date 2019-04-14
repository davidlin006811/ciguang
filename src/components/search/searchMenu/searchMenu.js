import React, { Component } from "react";
import "./searchMenu.css";

class SearchMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTabPosition: this.props.activeTabPosition
    };
  }

  selectMenu = index => {
    if (index === this.state.activeTabPosition) {
      return;
    }
    this.setState({
      activeTabPosition: index
    });
    this.props.selectMenu(index);
  };

  render() {
    return (
      <div className="search-menu-component">
        {this.props.list.map((item, index) => {
          let tabId = "tab-" + index;
          let listClass =
            index === this.state.activeTabPosition
              ? "search-menu-item active"
              : "search-menu-item";

          return (
            <div
              id={tabId}
              key={item.id}
              className={listClass}
              onClick={() => {
                this.selectMenu(index);
              }}
            >
              <span>{item.modelname}</span>
            </div>
          );
        })}
      </div>
    );
  }
}
export default SearchMenu;
