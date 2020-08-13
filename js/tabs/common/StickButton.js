/**
 * Created by Uncle Charlie, 2018/03/29
 * @flow
 */

import React from 'react';
import { Button } from 'native-base';
import _ from 'lodash';

type Prop = {
  waitTime: number,
  btnInitTime: number,
  // * 改变传入btnInitTime
  changeBtnTime: void,
  onPress: void,
};

export default class StickButton extends React.PureComponent<Prop, {}> {
  handlerChange = () => {
    const { btnInitTime, changeBtnTime, onPress, waitTime = 2000 } = this.props;
    const currentTime = new Date().getTime();
    if (currentTime > btnInitTime) {
      onPress();
      changeBtnTime(waitTime + currentTime);
    }
  };

  render() {
    const buttonProps = _.omit(this.props, ['onPress', 'changeBtnTime', 'btnInitTime', 'waitTime']);
    return <Button {...buttonProps} onPress={this.handlerChange} />;
  }
}
