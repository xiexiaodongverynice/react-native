/**
 * @flow
 * *用于控制modal展现的复用组件
 */

import React from 'react';

type VoidFunc = () => void;
type childrenFuncType = (visible: boolean, show: VoidFunc, hide: VoidFunc) => void;
type Props = {
  children: childrenFuncType, //children是一个function
};

type State = {
  visible: boolean,
};

export default class ModalWrapper extends React.PureComponent<Props, State> {
  state = {
    visible: false,
  };

  show = () => {
    this.setState({ visible: true });
  };

  hide = () => {
    this.setState({ visible: false });
  };
  render() {
    const { visible } = this.state;
    const { children } = this.props;
    return children({ visible, show: this.show, hide: this.hide });
  }
}
