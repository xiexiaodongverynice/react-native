/**
 * @flow
 */
import React, { Component } from 'react';
import _ from 'lodash';
import { StyleSheet, View, Image } from 'react-native';
import Swiper from 'react-native-swiper';

type Props = {
  style?: number | Object,
  data: Array<Object>,
  autoplay?: boolean,
};
export default class extends Component<Props> {
  _renderPagination = (currentIndex, total, context) => {
    const isActived = (index) => index === currentIndex;
    const activedStyle = {
      width: 8,
      backgroundColor: '#56A8F7',
    };
    const inactivedStyle = {
      width: 4,
      backgroundColor: '#eeeeee',
    };

    return (
      <View style={styles.pagination}>
        {_.map(_.times(total), (index) => (
          <View
            key={`pagination${index}`}
            style={[styles.paginationItem, isActived(index) ? activedStyle : inactivedStyle]}
          />
        ))}
      </View>
    );
  };

  render() {
    const { style, data, autoplay } = this.props;

    if (data.length > 0) {
      return (
        // $FlowFixMe
        <Swiper
          style={[styles.container, style]}
          autoplay={autoplay}
          renderPagination={this._renderPagination}
        >
          {_.map(data, (item, index) => {
            return (
              <View key={`carousel_${index}`} style={styles.slide}>
                <Image source={{ uri: item.url }} style={{ height: '100%', width: '100%' }} />
              </View>
            );
          })}
        </Swiper>
      );
    } else {
      return <View />;
    }
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#191970',
  },
  pagination: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    position: 'absolute',
    bottom: 5,
  },
  paginationItem: {
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
});
