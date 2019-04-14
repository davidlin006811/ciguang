import React, { Component } from "react";
import { Link } from "react-router-dom";
import Swiper from "react-id-swiper";
import { PreTxt, SlidersAPI, SharePreTxt } from "../commonConst";
import "./slideShow.css";

class Slider extends Component {
  constructor(props) {
    super(props);
    this.state = {
      api: SlidersAPI,
      sliders: []
    };
    this.mounted = false;
  }
  componentDidMount() {
    this.mounted = true;
    fetch(this.state.api, { method: "get" })
      .then(result => {
        return result.json();
      })
      .then(data => {
        if (data.code === 1) {
          // console.log(data.data.rows);
          data.data.rows.forEach(x => {
            x.url = x.url.replace(new RegExp(PreTxt, "g"), "/");
            x.url = x.url.replace(new RegExp(SharePreTxt, "g"), "");
            if (x.model === "info") {
              x.url = "/info/detail?url=" + x.url;
            }
          });
          if (this.mounted) {
            this.setState({
              sliders: data.data.rows
            });
          }
        }
      });
  }
  componentWillUnmount() {
    this.mounted = false;
  }
  renderDiv() {
    const params = {
      direction: "horizontal",
      pagination: {
        el: ".swiper-pagination",
        type: "bullets",
        clickable: true
      },
      autoplay: {
        delay: 8000,
        disableOnInteraction: false
      },
      loop: true,
      slidesPerView: "auto",
      effect: "slide",
      shouldSwiperUpdate: true
    };
    return (
      <Swiper {...params}>
        {this.state.sliders.map(item => (
          <div key={item.id} style={{ width: "100%" }} className="slide-item">
            <Link to={item.url}>
              <div style={{ backgroundImage: "url(" + item.cover + ")" }} />
              <p>{item.title}</p>
            </Link>
          </div>
        ))}
      </Swiper>
    );
  }
  render() {
    if (this.state.sliders.length > 0) {
      return this.renderDiv();
    } else {
      return <div style={{ height: "200px" }} />;
    }
  }
}
export default Slider;
