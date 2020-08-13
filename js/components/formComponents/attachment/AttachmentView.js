/**
 * Created by Uncle Charlie, 2018/08/18
 * @flow
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import _ from 'lodash';
import {
  Title,
  Content,
  Container,
  Body,
  ListItem,
  Text as NativeText,
  Icon,
  Right,
  Button,
  Left,
} from 'native-base';
import themes from '../../../tabs/common/theme';
import {
  ButtonListContainer,
  HeaderLeft,
  StyledHeader,
  Confirm,
} from '../../../tabs/common/components';
import HttpRequest from '../../../services/httpRequest';
import LoadingScreen from '../../../tabs/common/LoadingScreen';
import I18n from '../../../i18n';

type Prop = {
  navigation: {
    navigate: () => void,
    state: {
      params: {
        callback: (updateList: Array) => {}, //* 将变更后的数据传递
        data: Array,
        pageType: string,
        desc: any,
      },
    },
  },
};
type State = { fileInfoList: Array<any> };

export default class AttachmentView extends React.PureComponent<Prop, State> {
  constructor(props) {
    super(props);
    const { navigation } = this.props;
    const params = _.get(navigation, 'state.params');
    const attachment = _.get(params, 'data', []);
    this.callback = _.get(params, 'callback', _.noop);
    this.pageType = _.get(params, 'pageType');
    this.fieldDesc = _.get(params, 'desc');

    this.state = {
      fileInfoList: null,
      attachment,
    };
  }

  async componentDidMount() {
    const { navigation } = this.props;
    const { data = [] } = _.get(navigation, 'state.params');
    await this.getFileInfo(data);
  }

  getFileInfo = async (data) => {
    const { fileInfoList, attachment } = this.state;
    try {
      const newFileInfoList = await Promise.all(
        data.map((item) => HttpRequest.queryFileInfo({ key: item, token: global.FC_CRM_TOKEN })),
      );

      //* 首次进入页面只设置fileInfoList
      if (_.isNull(fileInfoList)) {
        this.setState({ fileInfoList: newFileInfoList });
      } else {
        this.setState({
          fileInfoList: newFileInfoList.concat(fileInfoList),
          attachment: attachment.concat(data),
        });
      }
    } catch (e) {
      console.error('附件信息有误');
    }
  };

  navigateTo = (fileInfo: {}) => {
    const { navigation } = this.props;

    navigation.navigate('Preview', {
      fileInfo,
      token: global.FC_CRM_TOKEN,
    });
  };

  navigateToPhoto = () => {
    const { navigation } = this.props;
    navigation.navigate('Photo', {
      pageType: this.pageType,
      fieldDesc: this.fieldDesc,
      photoList: [],
      callback: this.addPhotoList,
    });
  };

  addPhotoList = (imageList) => {
    const { attachment } = this.state;

    let updateList = attachment.slice();
    updateList = updateList.concat(imageList);

    this.callback(updateList);
    this.getFileInfo(imageList);
  };

  deleteAttachment = (key) => {
    const { attachment } = this.state;

    const updateList = attachment.slice();

    _.remove(updateList, (e) => e === key);

    this.setState({ attachment: updateList });
    this.callback(updateList);
  };

  renderContent = () => {
    const { fileInfoList, attachment } = this.state;

    if (_.isNull(fileInfoList)) return <LoadingScreen />;

    return _.map(attachment, (e, index) => {
      const item = _.find(fileInfoList, (info) => _.get(info, 'key') === e);
      const _error = _.get(item, '_error');
      if (_error) return null;

      const fileName = _.get(item, 'userMetadata.original-name');
      const key = `${_.get(item, 'etag', fileName)}_${index}`;

      return (
        <ListItem key={`${key}`} onPress={() => this.navigateTo(item)}>
          <Left>
            {this.pageType !== 'detail' ? (
              <TouchableOpacity
                onPress={() => {
                  Confirm({
                    title: '',
                    message: I18n.t('AttachmentView.ConfirmToDelete'),
                    onOK: () => {
                      this.deleteAttachment(e);
                    },
                  });
                }}
              >
                <Icon name="ios-remove-circle-outline" style={{ color: 'red' }} />
              </TouchableOpacity>
            ) : null}
            <NativeText style={{ fontSize: 14, textAlign: 'left' }}>{fileName}</NativeText>
          </Left>
          <Right>
            <Icon
              name="ios-arrow-forward"
              style={[styles.icon, { textAlign: 'right', paddingLeft: 5 }]}
            />
          </Right>
        </ListItem>
      );
    });
  };

  renderBtn = () => (
    <Button style={styles.actionButton} onPress={this.navigateToPhoto}>
      <NativeText style={{ color: themes.primary_button_text_color }}>
        {I18n.t('AttachmentView.Text.AddImages')}
      </NativeText>
    </Button>
  );

  render() {
    const { navigation } = this.props;
    const { title = I18n.t('AttachmentView.Text.Attachment') } = _.get(navigation, 'state.params');

    return (
      <Container style={{ backgroundColor: themes.fill_base }}>
        <StyledHeader>
          <HeaderLeft navigation={navigation} />
          <Body style={{ alignItems: 'center', flex: 1 }}>
            <Title
              style={{
                color: themes.title_text_color,
                fontSize: themes.title_size,
              }}
            >
              {title}
            </Title>
          </Body>
          <Right />
        </StyledHeader>
        <Content>
          <View style={{ flex: 1 }}>{this.renderContent()}</View>
        </Content>
        {this.pageType === 'detail' ? null : (
          <ButtonListContainer>{this.renderBtn()}</ButtonListContainer>
        )}
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  icon: {
    color: themes.color_header_icon,
    fontSize: themes.font_header_size,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 10,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: themes.primary_button_fill,
  },
});
