import React, { Component } from "react";

import { Link } from "react-router-dom";
import { PreTxt, SharePreTxt } from "../commonConst";
import "./latest-info.css";
import "../component.css";
class LatestInfo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      list: []
    };
    this.mounted = false;
  }
  componentDidMount() {
    this.mounted = true;
    fetch(this.props.api, { method: "get" })
      .then(result => {
        return result.json();
      })
      .then(data => {
        // console.log(data);
        if (this.mounted) {
          this.setState({
            list: data.data.rows
          });
        }

        // console.log(this.state.list);
      });
  }
  componentWillUnmount() {
    this.mounted = false;
  }
  render() {
    //console.log(this.props);
    return (
      <div className="latest-info-list">
        <ul>
          {this.state.list.map((item, index) => {
            if (item.model === "live") {
              item.url = "/cat/live/info?itemid=" + item.item_id;
            } else if (item.model === "info") {
              item.url = "/info/detail?url=" + item.url;
            } else {
              item.url = item.url.replace(new RegExp(PreTxt, "g"), "/");
            }
            item.url = item.url.replace(new RegExp(SharePreTxt, "g"), "");
            // console.log(item.url);
            return (
              <li className="latest-info-item" key={index}>
                <Link to={item.url}>
                  <img src={item.cover} alt={item.title} />
                  <div className="item-desc">
                    <div className="item-title">
                      <p
                        className="line-clamp-2"
                        style={{ WebkitBoxOrient: "vertical" }}
                      >
                        {item.title}
                      </p>
                    </div>
                    <div className="item-bottom">
                      <div className={"latest-info-" + item.model}>
                        {item.modelname}
                      </div>
                      <div className="info-date">{item.date}</div>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}
export default LatestInfo;
