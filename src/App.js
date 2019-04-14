import React, { Component } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import Home from "./components/home/home";
import Essence from "./components/essence/essence";
import EssenceDetail from "./components/essence/essence-detail/essence_detail";
import Photos from "./components/photos/photos";
import Photo from "./components/photos/photo/photo";
import Videos from "./components/videos/videos";
import Video from "./components/videos/video/video";
import Live from "./components/virtual/live";
import Radios from "./components/radios/radios";
import Radio from "./components/radios/radio/radio";
import Specials from "./components/specials/specials";
import CatSpecial from "./components/specials/catSpecial/catSpecial";
import Special from "./components/specials/special/special";
import Info from "./components/news/info/info";
import NewsCat from "./components/news/newsCat";
import Search from "./components/search/search/search";

export default class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <Switch>
          <Route exact path="/" component={Home} />
          <Route path="/home" component={Home} />
          <Route path="/essences" component={Essence} />
          <Route path="/cat/essence/:id" component={Essence} />
          <Route path="/tag/essence/:id" component={Essence} />
          <Route path="/videos" component={Videos} />
          <Route path="/cat/video/:id" component={Videos} />
          <Route path="/essence/:id" component={EssenceDetail} />
          <Route path="/news/:id" component={EssenceDetail} />
          <Route path="/newsAll" component={NewsCat} />
          <Route path="/cat/news/:id" component={NewsCat} />
          <Route path="/info/:id" component={Info} />
          <Route path="/video/:id" component={Video} />
          <Route path="/live" component={Live} />
          <Route path="/cat/live/:id" component={Live} />
          <Route path="/radios" component={Radios} />
          <Route path="/cat/radio/:id" component={Radios} />
          <Route path="/radio/:id" component={Radio} />
          <Route path="/photos" component={Photos} />
          <Route path="/cat/photo/:id" component={Photos} />
          <Route path="/pic/:id" component={Photo} />
          <Route path="/specials" component={Specials} />
          <Route path="/special/:id" component={Special} />
          <Route path="/cat/special/:id" component={CatSpecial} />
          <Route path="/searchInfo" component={Search} />
        </Switch>
      </BrowserRouter>
    );
  }
}
