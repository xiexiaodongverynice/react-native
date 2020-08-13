/**
 * Created by Uncle Charlie, 2018/04/29
 * @flow
 */

import React from 'react';
import { View, Text, Dimensions, Platform, StyleSheet } from 'react-native';
import _ from 'lodash';
import ViewTransformer from 'react-native-transformable-image';
import RNFS from 'react-native-fs';
import { Container, Header, Left, Button, Icon, Body, Right, Content, Spinner } from 'native-base';
import UtilConfig from '../../../utils/config';
import { MIDDLE_PATH } from '../../../utils/util';
import themes from '../../../tabs/common/theme';
import I18n from '../../../i18n';
import { StyledHeader } from '../../../tabs/common/components';

type Prop = { navigation: any, onComponentDidMount: any, onComponentUnMount: any };
type State = { imagePath: string, completeDownload?: boolean };

const { width: ScreenWidth, height: ScreenHeight } = Dimensions.get('window');
const platform = Platform.OS;

export default class PhotoDetailScreen extends React.Component<Prop, State> {
  state = { imagePath: '', completeDownload: false };
  photoCacheDir: string = RNFS.DocumentDirectoryPath + MIDDLE_PATH;

  async componentDidMount() {
    const { navigation, onComponentDidMount } = this.props;
    const imagePath = _.get(navigation, 'state.params.imagePath');
    if (_.isFunction(onComponentDidMount)) {
      onComponentDidMount(this.refresh);
    }
    // const photo = _.get(navigation, 'state.params.photoKey');
    // const result = await this.downloadPhotos(imagePath);
    // if (result) {
    // let imagePath = this.photoCacheDir + photo;

    // imagePath += photo.indexOf('.jpg') < 0 ? '.jpg' : '';

    this.setState({
      imagePath,
    });
  }

  componentWillUnmount() {
    const { onComponentUnMount } = this.props;
    if (_.isFunction(onComponentUnMount)) {
      onComponentUnMount();
    }
  }

  downloadPhotos = (imagePath: string): Promise<boolean> => {
    const { navigation } = this.props;
    const token = _.get(navigation, 'state.params.token');
    const {
      file_server,
      api: { upload_image },
    } = UtilConfig;

    const photo = _.get(navigation, 'state.params.photoKey');

    try {
      if (photo.indexOf('.jpg') < 0) {
        const localPath = this.photoCacheDir + photo + '.jpg';
        const { promise } = RNFS.downloadFile({
          fromUrl: imagePath,
          toFile: localPath,
        });
        return promise.then(
          (val) => {
            console.log('donwload return val', val);
            return true;
          },
          (err) => {
            console.log('download error', err);
            return false;
          },
        );
      }

      return Promise.resolve(true);
    } catch (e) {
      console.warn('download photos error', e);
      return Promise.resolve(false);
    }
  };

  renderContent = () => {
    let { imagePath } = this.state;
    const { completeDownload } = this.state;
    if (platform === 'android' && imagePath.indexOf('.jpg') > 0) {
      imagePath = `file://${imagePath}`;
    }

    return (
      <View
        style={{
          flex: 1,
          backgroundColor: 'black',
        }}
      >
        {!completeDownload && (
          <View style={[styles.loding]}>
            <Spinner color="blue" />
          </View>
        )}
        <ViewTransformer
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: ScreenWidth,
            height: ScreenHeight,
          }}
          onLoadEnd={() => {
            this.setState({ completeDownload: true });
          }}
          source={{ uri: imagePath }}
        />
      </View>
    );
  };

  render() {
    const { navigation } = this.props;
    return (
      <Container>
        <StyledHeader
          style={{
            backgroundColor: themes.title_background,
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <Left style={{ flex: 1 }}>
            <Button
              transparent
              onPress={() => {
                navigation.goBack();
              }}
            >
              <Icon
                name="ios-arrow-back"
                style={{
                  fontSize: 27,
                  color: themes.title_icon_color,
                }}
              />
            </Button>
          </Left>
          <Body
            style={{
              alignItems: 'center',
              flex: 1,
            }}
          >
            <Text
              style={{
                color: themes.title_text_color,
                fontWeight: '600',
                fontSize: themes.title_size,
                textAlign: 'center',
              }}
            >
              {I18n.t('photo_detail')}
            </Text>
          </Body>
          <Right />
        </StyledHeader>
        {platform === 'android' ? this.renderContent() : <Content>{this.renderContent()}</Content>}
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  loding: {
    position: 'absolute',
    top: themes.deviceHeight / 2 - themes.headerHeight,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
  },
});
