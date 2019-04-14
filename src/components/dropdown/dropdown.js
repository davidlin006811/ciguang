import React, { PureComponent } from "react";
import "./dropdown.css";
class DropDown extends PureComponent {
  constructor(props) {
    super(props);
    //console.log(props);
    this.state = {
      selectedItem: this.props.defaultItem,
      dropDown: false
    };
  }
  handleDropDown = () => {
    let dropDown = !this.state.dropDown;
    this.setState({
      dropDown: dropDown
    });
    this.props.handleDropdown(dropDown);
  };

  setItem = item => {
    if (item === this.state.selectedItem) {
      return;
    }
    this.setState({
      selectedItem: item,
      dropDown: false
    });
    this.props.setItem(item);
  };
  render() {
    let dropList;
    let top = 0 - 30 * this.props.list.length + "px";
    if (this.state.dropDown) {
      let list = this.props.list.map((item, index) => {
        let itemClass =
          item === this.state.selectedItem
            ? "selected-drop-down-item"
            : "drop-down-list-item";
        return (
          <li
            className={itemClass}
            key={index}
            onClick={() => {
              this.setItem(item);
            }}
          >
            {item}
          </li>
        );
      });
      dropList = (
        <div className="dropdown-list" style={{ top: top }}>
          <ul>{list}</ul>
        </div>
      );
    }

    return (
      <div className="drop-down-component">
        {dropList}
        <div className="dropdown-selected-item" onClick={this.handleDropDown}>
          {this.state.selectedItem}
        </div>
      </div>
    );
  }
}
export default DropDown;
