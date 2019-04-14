import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import "bootstrap/dist/css/bootstrap.css";
import * as serviceWorker from "./serviceWorker";
import App from "./app";

ReactDOM.render(<App />, document.getElementById("root"));
serviceWorker.unregister();

serviceWorker.register({
  onUpdate: async registration => {
    await registration.update();
    /*message.info(
      "网站更新完成, 请刷新页面: " + moment().format("YYYY-MM-DD HH:mm:ss"),
      0.5,
      () => {
        window.location.reload();
      }
    );*/
  },
  onSuccess: () => {}
});
