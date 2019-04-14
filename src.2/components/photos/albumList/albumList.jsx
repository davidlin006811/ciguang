import React, { PureComponent } from "react";
import "../../component.css";
import loadingImg from "../../image/loading.gif";
import { PullToRefresh } from "react-js-pull-to-refresh";
import { compareDate } from "../../commonFunctions";
import { AlbumPreTxt } from "../../commonConst";
import slideImg from "../../image/slideshow.svg";
import "../photoList/photoList.css";
import "./albumList.css";
class AlbumList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      list: [],

      loadFinish: true,
      lastUpdateTime: "",
      lastCompareUpdateTime: "",
      update: this.props.update
    };
  }
  refresh = () => {
    this.setState({
      loadFinish: false
    });
    return new Promise((resolve, reject) => {
      fetch(this.props.url, { method: "get" })
        .then(result => {
          return result.json();
        })
        .then(data => {
          if (data.code === 1) {
            //console.log("list data: ", data);

            data.data.rows.forEach(x => {
              //console.log("url: ", x.share_url);
              x.url = x.url.replace(new RegExp(AlbumPreTxt, "g"), "/pic/info");
            });

            let updateTime = new Date();
            let lastCompareUpdateTime = compareDate(this.state.lastUpdateTime);
            this.setState({
              cate_id: data.data.cate_id,
              cate_title: data.data.cate_title,
              totalCount: data.data.total_count,
              list: data.data.rows,
              loadFinish: true,
              lastUpdateTime: updateTime,
              lastCompareUpdateTime: lastCompareUpdateTime
            });

            resolve(true);
          } else {
            reject(false);
          }
        });
    });
  };

  componentDidMount() {
    let date = new Date();
    let compDate = compareDate(date);
    this.setState({
      lastUpdateTime: date,
      lastCompareUpdateTime: compDate
    });

    this.refresh();
  }

  render() {
    //console.log(this.state);
    let updateTime, pullPress, pullRelease, freshArea;

    pullPress = (
      <div
        style={{
          textAlign: "center",
          fontSize: "14px",
          backgroundColor: "#f2f3f8"
        }}
      >
        <i
          className="fas fa-long-arrow-alt-down"
          style={{ paddingRight: "10px" }}
        />
        下拉可以更新
        <p
          style={{
            paddingTop: "5px",
            paddingBottom: "10px",
            textAlign: "center"
          }}
        >
          最後更新：
          {this.state.lastCompareUpdateTime}
        </p>
      </div>
    );
    pullRelease = (
      <div
        style={{
          textAlign: "center",
          fontSize: "14px",
          backgroundColor: "#f2f3f8"
        }}
      >
        <i
          className="fas fa-long-arrow-alt-up"
          style={{ paddingRight: "10px" }}
        />
        松開立即刷新
        <p
          style={{
            paddingTop: "5px",
            paddingBottom: "10px",
            textAlign: "center"
          }}
        >
          最後更新：
          {this.state.lastCompareUpdateTime}
        </p>
      </div>
    );

    if (this.state.loadFinish) {
      freshArea = null;
    } else {
      freshArea = (
        <div
          style={{
            width: "100%",
            marginTop: "-40%",
            paddingBottom: "20px",
            paddingLeft: "32%",
            fontSize: "14px",
            backgroundColor: "#f2f3f8"
          }}
        >
          <img src={loadingImg} alt="正在刷新數據" style={{ width: "30px" }} />
          <span style={{ fontWeight: "bold" }}>正在刷新數據</span>
          {updateTime}
        </div>
      );
    }
    let slideShowUrl;
    if (this.state.list.length > 0) {
      slideShowUrl = this.state.list[0].url + "&play=true";
    }
    let menu = (
      <div className="photo-menu">
        <div className="photo-menu-title">{this.state.cate_title}</div>
        <div className="photo-menu-count">共{this.state.totalCount}个</div>
        <div className="photo-menu-btn">
          <a href={slideShowUrl}>
            <img src={slideImg} alt="slide show" />
          </a>
        </div>
      </div>
    );

    let list = (
      <div id={this.state.cate_id} className="photos-list-component">
        {menu}
        {this.state.list.map((item, index) => {
          return (
            <a className="focus-photo" key={item.id} href={item.url}>
              <img src={item.cover} alt="pic-item" />
              <p className="photo-title">{item.title}</p>
              <p className="photo-update">{item.date}</p>
            </a>
          );
        })}
      </div>
    );

    //console.log(this.props);
    return (
      <PullToRefresh
        onRefresh={this.refresh}
        pullDownThreshold={200}
        triggerHeight={50}
        pullDownContent={pullPress}
        releaseContent={pullRelease}
      >
        {freshArea}
        <div>{list}</div>
      </PullToRefresh>
    );
  }
}
export default AlbumList;
