import React from "react";
import "./modal.css";
class Modal extends React.Component {
  close = () => {
    this.props.close();
  };
  confirm = () => {
    this.props.confirm();
  };
  render() {
    // console.log(this.props);
    return (
      <div className="backdrop">
        <div className="modal-window">
          <p>{this.props.action}</p>
          <p>{this.props.title}</p>

          <div className="modal-footer">
            <div
              onClick={() => {
                this.close();
              }}
              className="left-div"
            >
              {this.props.no}
            </div>
            <div
              onClick={() => {
                this.confirm();
              }}
            >
              {this.props.yes}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Modal;
