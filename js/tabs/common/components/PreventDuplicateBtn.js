/**
 * @flow
 */

import React from 'react';
import { Button } from 'native-base';
import _ from 'lodash';
import { Text, StyleSheet } from 'react-native';
import themes from '../theme';
import { Throttle } from '../helpers/naviagteHelper';

type Prop = {
  btnLoading: boolean,
  btnText: string,
  changeBtnTime: void,
  onPress: void,
  queryError: boolean,
  querySuccess: boolean,
};

export default class StickButton extends React.PureComponent<Prop, State> {
  clickStatus = true;
  changeStatusTimer = '';

  componentWillReceiveProps(nextProps) {
    const { btnLoading, queryError, querySuccess } = nextProps;

    if (querySuccess) {
      clearTimeout(this.changeStatusTimer);
      this.clickStatus = false;
    } else {
      if (btnLoading) {
        clearTimeout(this.changeStatusTimer);
      } else if (!btnLoading && queryError) {
        clearTimeout(this.changeStatusTimer);
        this.clickStatus = true;
      }
    }
  }

  handlerClick = () => {
    const { onPress } = this.props;

    if (this.clickStatus) {
      this.clickStatus = false;
      this.changeStatusTimer = setTimeout(() => {
        this.clickStatus = true;
      }, 2000);

      onPress();
    }
  };

  render() {
    const { btnLoading, btnText } = this.props;
    const buttonProps = _.omit(this.props, ['onPress']);

    return (
      <Button
        {...buttonProps}
        onPress={Throttle(this.handlerClick, 2000)}
        style={[
          styles.actionButton,
          { backgroundColor: btnLoading ? '#BEDCFF' : themes.primary_button_fill },
        ]}
      >
        <Text style={{ color: '#fff', fontSize: 18 }}>
          {btnText}
          {/* {btnLoading ? `${btnText}...` : btnText} */}
        </Text>
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
