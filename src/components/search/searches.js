import React, { Component } from "react";
import { Link } from "react-router-dom";
import CiguangImg from "../image/ciguang.jpg";
import searchImg from "../image/search.svg";
import "./searches.css";

class Searches extends Component {
  render() {
    return (
      <div className="searches-component clearfix">
        <div className="searches-logo">
          <img src={CiguangImg} alt="ciguang" />
        </div>
        <div className="searches-item">
          <div className="searches-field">
            <Link to="/searchInfo">
              <img src={searchImg} alt="search" />
              <span>凈土大經科註第五回</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
export default Searches;
