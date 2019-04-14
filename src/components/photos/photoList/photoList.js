import React, { PureComponent } from "react";
import { Link } from "react-router-dom";
import "../../component.css";
import loadingImg from "../../image/loading.gif";
import { PullToRefresh } from "react-js-pull-to-refresh";
import { compareDate } from "../../commonFunctions";
//import { PreTxtPhoto, PreTxt } from "../../commonConst";
import slideImg from "../../image/slideshow.svg";
import "./photoList.css";

class PhotoList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      list: [],
      focus: {},
      loadFinish: true,
      lastUpdateTime: "",
      lastCompareUpdateTime: "",
      update: this.props.update
    };
    this.mounted = false;
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
              let id = x.id;
              let num = x.num;
              let parentNum = x.parent_num;
              let catId = this.props.id;

              x.pic_url =
                "/pic/info?catid=" +
                catId +
                "&parentNum=" +
                parentNum +
                "&num=" +
                num +
                "&id=" +
                id;
            });

            let focus = data.data.rows.shift();

            let updateTime = new Date();
            let lastCompareUpdateTime = compareDate(this.state.lastUpdateTime);
            if (this.mounted) {
              this.setState({
                cate_id: data.data.cate_id,
                cate_title: data.data.cate_title,
                totalCount: data.data.total_count,
                list: data.data.rows,
                focus: focus,
                loadFinish: true,
                lastUpdateTime: updateTime,
                lastCompareUpdateTime: lastCompareUpdateTime
              });
            }
            resolve(true);
          } else {
            reject(false);
          }
        });
    });
  };

  componentDidMount() {
    this.mounted = true;
    let date = new Date();
    let compDate = compareDate(date);
    this.setState({
      lastUpdateTime: date,
      lastCompareUpdateTime: compDate
    });

    this.refresh();
  }
  componentWillUnmount() {
    this.mounted = false;
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
        <i className="iconfont" style={{ paddingRight: "10px" }}>
          &#xe62e;
        </i>
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
        <i className="iconfont" style={{ paddingRight: "10px" }}>
          &#xe749;
        </i>
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
    let slideShowUrl = this.state.focus.pic_url + "&play=true";
    const menu = (
      <div className="photo-menu">
        <div className="photo-menu-title">{this.state.cate_title}</div>
        <div className="photo-menu-count">共{this.state.totalCount}张</div>
        <div className="photo-menu-btn">
          <Link to={slideShowUrl}>
            <img src={slideImg} alt="slide show" />
          </Link>
        </div>
      </div>
    );
    let focusUrl =
      typeof this.state.focus.pic_url !== "undefined"
        ? this.state.focus.pic_url
        : "#";
    let list = (
      <div id={this.state.cat_id} className="photos-list-component">
        {menu}
        <Link className="focus-photo" to={focusUrl}>
          <img src={this.state.focus.share_image} alt="focus" />
          <p className="photo-title">{this.state.focus.title}</p>
          <p className="videos-update">{this.state.focus.date}</p>
        </Link>

        {this.state.list.map((item, index) => {
          let itemClassName =
            index % 2 === 0 ? "video-item left" : "video-item right";

          return (
            <Link className={itemClassName} key={item.id} to={item.pic_url}>
              <img src={item.share_image} alt="pic-item" />
              <p className="video-title">{item.title}</p>
              <p className="videos-update">{item.date}</p>
            </Link>
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
export default PhotoList;
