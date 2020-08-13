import React from 'react';

let sharedInstance = null;

//为了避免将<Modal>写在render方法内，特地创建此component
export class RNMWrapper extends React.Component {
  constructor(props) {
    super(props);
    sharedInstance = this;
    this.state = {
      elem: null,
    };
  }

  render() {
    return this.state.elem;
  }
}

//传入一个Component，Component应该是类或function
export function rnm_alert(elem) {
  sharedInstance.setState({ elem });
}

//让react释放之前的elem
export function rnm_hideAlert() {
  sharedInstance.setState({ elem: null });
}
