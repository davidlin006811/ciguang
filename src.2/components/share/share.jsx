import React, { PureComponent } from "react";
import QRCode from "qrcode.react";
import MediaQuery from "react-responsive";
import "./share.css";
import QQImg from "../image/qq.png";
import QZoneImg from "../image/QQspace.png";
import WeChatImg from "../image/wechat.png";
import WeiBoImg from "../image/weibo.png";
import TencentImg from "../image/tencent.png";
import DouBanImg from "../image/douban.png";
import GoogleImg from "../image/google.svg";
import TwitterImg from "../image/twitter.png";
import FacebookImg from "../image/Facebook.png";
import LinkdinImg from "../image/linkdin.png";
import linkImg from "../image/link.svg";
//import * as socialShare from "social-share.js";
class Share extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      sites: ["weibo", "wechat", "qq", "qzone", "link"],
      icons: {
        qzone: QZoneImg,
        weibo: WeiBoImg,
        qq: QQImg,
        tencent: TencentImg,
        wechat: WeChatImg,
        douban: DouBanImg,
        google: GoogleImg,
        twitter: TwitterImg,
        facebook: FacebookImg,
        linkedin: LinkdinImg,
        link: linkImg
      },
      names: {
        qzone: "QQ空间",
        weibo: "微博",
        qq: "QQ",
        tencent: "腾讯空间",
        wechat: "微信",
        douban: "豆瓣",
        google: "Google+",
        twitter: "Twitter",
        facebook: "Facebook",
        linkedin: "Linekdin",
        link: "复制链接"
      },
      source: "慈光",
      wechatQrcodeTitle: "微信扫一扫：分享",
      wechatQrcodeHelper:
        "微信里点“发现”，扫一下,二维码便可将本文分享至朋友圈。",
      origin: window.location.origin
    };
  }
  hideShare = () => {
    this.props.hideShare();
  };
  copyLink = e => {
    var input = document.createElement("input");
    input.value = this.props.url;
    document.body.appendChild(input);
    input.select();
    input.setSelectionRange(0, input.value.length);
    document.execCommand("Copy");
    document.body.removeChild(input);
  };
  render() {
    let url = this.props.url;
    let appKey = encodeURIComponent("5bd32d6f1dff4725ba40338b233ff155");
    let encodeUrl = encodeURIComponent(url);
    let wechatQrcodeTitle = this.state.wechatQrcodeTitle;
    let wechatQrcodeHelper = this.state.wechatQrcodeHelper;
    let title = encodeURIComponent(this.props.title);
    let description = encodeURIComponent(this.props.description);
    let image = encodeURIComponent(this.props.image);
    let site = encodeURIComponent(this.props.source);
    let origin = encodeURIComponent(this.props.origin);
    let source = site;
    let summary = description;
    const templates = {
      qzone: `http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${encodeUrl}&title=${title}&desc=${description}&summary=${summary}&site=${source}`,
      qq: `http://connect.qq.com/widget/shareqq/index.html?url=${encodeUrl}&title=${title}&source=${source}&desc=${description}`,
      tencent: `http://share.v.t.qq.com/index.php?c=share&a=index&title=${title}&url=${encodeUrl}&appKey=${appKey}&pic=${image}`,
      weibo: `http://service.weibo.com/share/share.php?url=${encodeUrl}&title=${title}&pic=${image}`,
      wechat: `javascript:`,
      douban: `http://shuo.douban.com/!service/share?href=${encodeUrl}&name=${title}&text=${description}&image=${image}&starid=0&aid=0&style=11`,
      linkedin: `http://www.linkedin.com/shareArticle?mini=true&ro=true&title=${title}&url=${url}&summary=${summary}&source=${source}&armin=armin`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?text=${title}&url=${url}&via=${origin}`,
      google: `https://plus.google.com/share?url=${url}`
    };
    let siteList = this.state.sites.map((site, index) => {
      if (site === "wechat") {
        let weChat = (
          <div key={index} className="wechat-qrcode">
            <h4>{wechatQrcodeTitle}</h4>
            <div className="qrcode">
              <QRCode value={url} size={100} />
            </div>
            <div className="help">
              <p>{wechatQrcodeHelper}</p>
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
      } else if (site === "link") {
        return (
          <div
            key={index}
            className="social-share-icon icon-link"
            onClick={e => {
              e.stopPropagation();
              this.copyLink();
            }}
          >
            <img src={this.state.icons[site]} alt="social" />
            <p>{this.state.names[site]}</p>
          </div>
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
    let bottom = !this.props.hideBottom ? (
      <div className="share-bottom" onClick={this.hideShare}>
        取消
      </div>
    ) : null;

    return (
      <React.Fragment>
        <MediaQuery query="(orientation: portrait)">
          <div className="social-share">
            <h6>分享到</h6>
            {siteList}
            {bottom}
          </div>
        </MediaQuery>
        <MediaQuery query="(orientation: landscape)">
          <div id="shareLandscape" className="social-share">
            <h6>分享到</h6>
            {siteList}
            {bottom}
          </div>
        </MediaQuery>
      </React.Fragment>
    );
  }
}
export default Share;
