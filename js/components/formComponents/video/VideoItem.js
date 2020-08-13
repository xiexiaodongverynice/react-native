/**
 * @flow
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Icon } from 'native-base';
import { transformSeconds } from '../../../utils/util';

type Prop = {
  name: string,
  duration: Number,
  isEditing: boolean,
  onPress: (val: string) => void,
  onDelete: (val: string) => void,
};

export default ({ name, duration, isEditing, onPress, onDelete }: Prop) => (
  <TouchableOpacity style={styles.container} onPress={onPress}>
    {isEditing ? (
      <TouchableOpacity style={styles.deleteWrapper} onPress={onDelete}>
        <Icon style={styles.deleteIcon} name="ios-remove-circle" />
      </TouchableOpacity>
    ) : null}
    <Text numberOfLines={1} style={styles.name}>
      {name}
    </Text>
    <Text style={styles.duration}>{duration ? transformSeconds(duration) : '--:--'}</Text>
    <View style={styles.arrow} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    height: 50,
    paddingRight: 15,
    borderColor: '#c6c6c6',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteWrapper: {
    height: '100%',
    justifyContent: 'center',
    paddingLeft: 15,
    marginRight: -5,
  },
  deleteIcon: {
    fontSize: 20,
    color: 'red',
    marginTop: 5,
  },
  name: {
    textAlign: 'left',
    marginLeft: 15,
    flex: 1,
    fontSize: 17,
  },
  duration: {
    color: '#8f8e94',
  },
  arrow: {
    height: 9,
    width: 9,
    marginLeft: 8,
    marginBottom: -3,
    borderColor: '#8f8e94',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    transform: [{ rotate: '-45deg' }],
  },
});
