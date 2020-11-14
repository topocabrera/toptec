import React, { Component } from "react";

class App extends Component {
  render() {
    const date = new Date();
    return (
      <footer role="contentinfo" className="footer">
        <div className="copy-right_text">
          <div className="container">
            <div className="footer_border"></div>
            <div className="row">
              <div className="col-xl-7 col-md-6">
                <p className="copy_right">
                  Copyright &copy;
                  {date.getFullYear()} All rights reserved | 
                  <span className="footer_made">
                  This template is made by{" "}
                  <a
                    href="https://www.linkedin.com/in/jeremiascabrera/"
                    target="_blank"
                  >
                    TopTec
                  </a>
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    );
  }
}

export default App;
