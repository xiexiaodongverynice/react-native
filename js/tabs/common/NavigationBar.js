/*
 Created by Uncle Charlie, 2017/11/24
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import _ from 'lodash';

// TODO: popover
export default class NavigationBar extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      visiblePopovers: [],
    };
  }
  _renderLeft = ({ leftTitle, leftAction }) => {
    if (leftAction) {
      return (
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <TouchableOpacity
            style={{ flex: 1, marginLeft: 20 }}
            onPress={() => {
              leftAction();
            }}
          >
            <Text
              style={{
                textAlign: 'left',
                marginLeft: 10,
                color: 'white',
                fontSize: 18,
              }}
            >
              {leftTitle || 'back'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    return <View style={{ flex: 1 }} />;
  };

  _setVisiblePopover = (visibleIndex) => {
    this.state.visiblePopovers.forEach((item, index) => {
      if (index !== visibleIndex) {
        item = false;
      }
      item = true;
    });
  };

  _renderRight = ({ rightTitles, rightActions }) => {
    if (!rightTitles || !rightActions) {
      return null;
    }

    if (
      !Array.isArray(rightTitles) ||
      !Array.isArray(rightActions) ||
      rightTitles.length !== rightActions.length
    ) {
      throw new Error('right titles or right actions are not array, or their number is not equal!');
    }

    return (
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        {
          //
          // _.map( rightActions, (action, index) => (
          //  Popover
          //   )
          // )
        }
      </View>
    );
  };

  render() {
    return (
      <View style={styles.container}>
        {this._renderLeft(this.props)}
        <Text
          style={{
            flex: 1,
            textAlign: 'center',
            color: 'white',
            fontSize: 18,
          }}
        >
          {this.props.title}
        </Text>
        {this._renderRight(this.props)}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    height: 50,
    backgroundColor: '#3682D5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
