import React, { Component } from "react";
import favoriteNImg from "../../image/favorite-n.svg";
import favoriteImg from "../../image/favorite.svg";
import downloadImg from "../../image/download.svg";
import shareImg from "../../image/share.svg";

class VideoInfo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: this.props.title,
      totalCount: this.props.totalCount,
      currentVideo: this.props.currentVideo
      //favorite: this.props.favorite
    };
  }

  addFavorite = id => {
    //this.props.addFavorite();
    let fav = !this.props.favorite;
    this.props.setFavorite(fav);
  };
  showShare = () => {
    this.props.showShare();
  };
  componentWillReceiveProps(nextProps) {
    if (nextProps.totalCount !== this.props.totalCount) {
      this.setState({
        title: nextProps.title,
        totalCount: nextProps.totalCount,
        currentVideo: nextProps.currentVideo
      });
    }
  }
  render() {
    let favImg = this.props.favorite ? favoriteImg : favoriteNImg;
    // let link = "/video-download/video-level2?catid=" + this.props.catId;
    return (
      <div className="current-video-cat">
        <div className="current-video-cat-info">
          <span>
            更新至
            {this.state.totalCount}集
          </span>
          <span className="txt-seperate" />
          <span>{this.state.currentVideo.date}</span>
          <span className="txt-seperate" />
          <span>{this.state.currentVideo.address}</span>
        </div>
        <div className="video-cat-info">
          <div
            style={{
              width: "70%"
            }}
          >
            <span
              style={{
                border: "1px solid #a1a1a1",
                borderRadius: "5px",
                padding: "3px"
              }}
            >
              {this.state.title}
            </span>
          </div>
          <img
            src={favImg}
            alt="favorite"
            onTouchStart={() => {
              this.addFavorite(this.state.currentVideo.id);
            }}
          />
          <a>
            <img src={downloadImg} alt="download" />
          </a>
          <img src={shareImg} alt="share" onClick={this.showShare} />
        </div>
      </div>
    );
  }
}
export default VideoInfo;
