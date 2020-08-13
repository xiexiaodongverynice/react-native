/**
 *
 * @flow
 */

import React, { Component } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  DeviceEventEmitter,
} from 'react-native';
import { Icon, ListItem, List, ActionSheet } from 'native-base';
import _ from 'lodash';
import themes from '../../common/theme';

interface ModalView {
  multipleViews: Array;
  setModalView(visible: boolean, viewStatus: object): void;
  visible: boolean;
}

const ModalViewScreen = (props: ModalView) => {
  const { multipleViews, visible, setModalView } = props;
  const _returnModalVisible = () => setModalView(visible);

  return (
    <View>
      <Modal
        animationType="none"
        transparent
        visible={visible}
        onRequestClose={_returnModalVisible}
        onDismiss={_returnModalVisible}
        supportedOrientations={[
          'portrait',
          'portrait-upside-down',
          'landscape',
          'landscape-left',
          'landscape-right',
        ]}
        onOrientationChange={() => {}}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => {
            setModalView(false);
          }}
          activeOpacity={0}
        >
          <View
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', flex: 1, marginTop: themes.menuHeight }}
          >
            {_.map(multipleViews, (item, key) => (
              <TouchableOpacity
                onPress={() => {
                  setModalView(false, item);
                }}
                activeOpacity={0}
                key={`modalView-${key}`}
              >
                <View
                  style={{
                    backgroundColor: '#fff',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 40,
                  }}
                >
                  <Text style={{ color: '#333', fontSize: 15 }}>{_.get(item, 'name')}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default ModalViewScreen;
