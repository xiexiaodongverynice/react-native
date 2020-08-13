/**
 * Created by Uncle Charlie, 2018/04/28
 * @flow
 */

import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { Icon } from 'native-base';
import { getFileName, getPhotoKey } from '../../../utils/util';
import UtilConfig from '../../../utils/config';

type Prop = {
  edge: number,
  token: string,
  photo: string,
  imagePath: string,
  editing: boolean,
  onDelete: (val: string) => void,
  navToDetail: (val: string, photoKey: string) => void,
};

type State = {};

export default class ImageItem extends React.PureComponent<Prop, State> {
  state: State = { editing: false };

  static getDerivedStatefromProps(nextProps: Prop, prevState: State) {
    if (nextProps.editing !== prevState.editing) {
      return { editing: nextProps.editing };
    }
    return null;
  }

  handleDelete = () => {
    const { imagePath, onDelete } = this.props;
    onDelete && onDelete(getFileName(imagePath));
  };

  showDetail = () => {
    const { navToDetail, imagePath, photo, token } = this.props;
    const {
      file_server,
      api: { upload_image },
    } = UtilConfig;

    let detailPath = '';
    if (imagePath.indexOf('.jpg') > 0) {
      detailPath = imagePath;
    } else {
      detailPath = file_server + upload_image + photo + '?token=' + token;
    }
    navToDetail && navToDetail(detailPath, photo);
  };

  render() {
    const { imagePath, edge, editing, onDelete = () => {} } = this.props;

    return (
      <View>
        <TouchableOpacity onPress={this.showDetail}>
          <Image
            style={[styles.image, { height: edge, width: edge }]}
            source={{ uri: imagePath }}
          />
        </TouchableOpacity>
        {editing && (
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 10,
              right: -18,
              width: 50,
              height: 50,
              zIndex: 1000,
            }}
            onPress={this.handleDelete}
          >
            <Icon
              style={{
                fontSize: 40,
                color: 'red',
              }}
              name="ios-remove-circle-outline"
            />
          </TouchableOpacity>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  image: {
    marginTop: 10,
    marginLeft: 8,
  },
});
