/**
 * @flow
 */

import React from 'react';
import { Button } from 'native-base';
import _ from 'lodash';
import { Text, StyleSheet } from 'react-native';
import themes from '../../tabs/common/theme';

type Prop = {
  btnLoading: boolean,
  btnText: string,
  changeBtnTime: void,
  onPress: void,
};

export default class StickButtonView extends React.PureComponent<Prop, State> {
  static defaultProps = {
    onPress: _.noop,
  };

  limitTime = 0;

  handleThrottle = () => {
    const currentTime = Date.now();
    if (this.limitTime != 0 && currentTime - this.limitTime < 2000) {
      this.limitTime = currentTime;
      return;
    }
    this.limitTime = currentTime;
    this.props.onPress();
  };

  handlerClick = _.debounce(this.handleThrottle, 1000, {
    leading: true,
    trailing: false,
  });

  render() {
    const { btnLoading, btnText } = this.props;
    const buttonProps = _.omit(this.props, ['onPress']);

    return (
      <Button
        {...buttonProps}
        onPress={this.handlerClick}
        style={[
          styles.actionButton,
          { backgroundColor: btnLoading ? '#BEDCFF' : themes.primary_button_fill },
        ]}
      >
        <Text style={{ color: '#fff', fontSize: 18 }}>{btnText}</Text>
      </Button>
    );
  }
}

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
    marginHorizontal: 10,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: themes.primary_button_fill,
  },
});
