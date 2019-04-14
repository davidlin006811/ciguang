import React, { PureComponent } from "react";
import QRCode from "qrcode.react";
import "./share.css";
import QQImg from "../image/qq.png";
import QZoneImg from "../image/QQspace.png";
import WeChatImg from "../image/wechat.png";
import WeiBoImg from "../image/weibo.png";

class VideoShare extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      sites: ["weibo", "wechat", "qq", "qzone"],
      icons: {
        qzone: QZoneImg,
        weibo: WeiBoImg,
        qq: QQImg,
        wechat: WeChatImg
      },
      names: {
        qzone: "QQ空间",
        weibo: "微博",
        qq: "QQ",
        wechat: "微信"
      },
      source: "慈光"
    };
  }

  render() {
    let url = this.props.url;
    let encodeUrl = encodeURIComponent(url);
    let title = encodeURIComponent(this.props.title);
    let description = encodeURIComponent(this.props.description);
    let image = encodeURIComponent(this.props.image);
    let site = encodeURIComponent(this.props.source);
    let source = site;
    let summary = description;
    const templates = {
      qzone: `http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${encodeUrl}&title=${title}&desc=${description}&summary=${summary}&site=${source}`,
      qq: `http://connect.qq.com/widget/shareqq/index.html?url=${encodeUrl}&title=${title}&source=${source}&desc=${description}`,
      weibo: `http://service.weibo.com/share/share.php?url=${encodeUrl}&title=${title}&pic=${image}`,
      wechat: `javascript:`
    };
    let siteList = this.state.sites.map((site, index) => {
      if (site === "wechat") {
        let weChat = (
          <div key={index} className="wechat-qrcode">
            <div className="qrcode">
              <QRCode value={url} size={80} />
            </div>
          </div>
        );
        return (
          <a
            key={index}
            className="social-share-icon icon-wechat"
            target="_blank"
            href="javascript:"
            rel="noopener noreferrer"
          >
            <img src={this.state.icons[site]} alt="social" />
            <p>{this.state.names[site]}</p>
            {weChat}
          </a>
        );
      } else {
        let className = `icon-${site} social-share-icon`;
        return (
          <a
            key={index}
            className={className}
            href={templates[site]}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={this.state.icons[site]} alt="social" />
            <p>{this.state.names[site]}</p>
          </a>
        );
      }
    });
    let socialShare;
    if (this.props.landscape) {
      socialShare = (
        <div
          id="socialSharelandscape"
          className="social-share"
          style={{
            backgroundColor: "rgba(0 ,0, 0, 0.5)",
            color: "white"
          }}
        >
          <p style={{ fontSize: "12px" }}>分享到</p>
          {siteList}
        </div>
      );
    } else {
      socialShare = (
        <div
          id="socialShare"
          className="social-share"
          style={{
            marginTop: "0",
            backgroundColor: "rgba(0 ,0, 0, 0.5)",
            color: "white"
          }}
        >
          {siteList}
        </div>
      );
    }
    return <React.Fragment>{socialShare}</React.Fragment>;
  }
}
export default VideoShare;
