/**
 *
 * @flow
 */

import React from 'react';
import { View, Modal, Text } from 'react-native';
import { Spinner } from 'native-base';
import _ from 'lodash';
import theme from '../../tabs/common/theme';

/* eslint-disable react/no-unused-prop-types */
type Props = {
  visibleStatus: boolean,
  needAutoClear: boolean, //* 是否需要定时清除 默认支持
  children: Element,
  handleModalLoading: (visible: boolean) => void,
  lazy: number,
  tip: string,
};
/* eslint-disable react/no-unused-prop-types */

export default class ModalLoadingScreen extends React.Component<Props, {}> {
  componentWillReceiveProps(nextPorps) {
    const needAutoClear = _.get(this.props, 'needAutoClear', true);
    if (!needAutoClear) {
      return;
    }
    const lazy = _.get(this.props, 'lazy', 20000);
    const current = _.get(this.props, 'visibleStatus');
    const next = _.get(nextPorps, 'visibleStatus');
    const handle = _.get(this.props, 'handleModalLoading', () => {});
    if (current !== next && next === true) {
      //* 超时设置自动取消
      setTimeout(() => {
        handle(false);
      }, lazy);
    }
  }

  renderTip = (tip) => {
    const textStyle = {
      color: '#fff',
      fontSize: 14,
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
    };
    return (
      <View style={{ marginTop: -5 }}>
        <Text style={textStyle} numberOfLines={1}>
          {tip}
        </Text>
      </View>
    );
  };

  render() {
    const { visibleStatus, children, tip } = this.props;
    return (
      <View>
        <Modal
          animationType="none"
          transparent
          visible={visibleStatus}
          supportedOrientations={[
            'portrait',
            'portrait-upside-down',
            'landscape',
            'landscape-left',
            'landscape-right',
          ]}
          onOrientationChange={() => {}}
        >
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                backgroundColor: theme.fill_mask,
                justifyContent: 'center',
                width: 140,
                height: 100,
                borderRadius: 3,
                alignItems: 'center',
              }}
            >
              {children || <Spinner color="#fff" style={{ height: 60 }} />}
              {tip ? this.renderTip(tip) : null}
            </View>
          </View>
        </Modal>
      </View>
    );
  }
}

ModalLoadingScreen.defaultProps = {
  visibleStatus: false,
};
