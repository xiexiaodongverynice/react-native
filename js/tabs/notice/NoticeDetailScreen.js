/**
 *Created by Guanghua on 12/25;
 @flow
 */

import React from 'react';
import {
  Container,
  Header,
  Content,
  Text,
  Badge,
  Left,
  Body,
  Right,
  Button,
  Icon,
  Title,
  ListItem,
} from 'native-base';
import _ from 'lodash';
import moment from 'moment';
import { StyleSheet, View } from 'react-native';
import ErrorScreen from '../common/ErrorScreen';
import I18n from '../../i18n';
import themes from '../common/theme';
import AttachmentItem from '../../components/formComponents/attachment/AttachmentItem';
import RecordService from '../../services/recordService';
import { StyledHeader } from '../common/components';

type Prop = {
  navigation: any,
};

type State = {};

export default class NoticeDetailScreen extends React.Component<Prop, State> {
  componentDidMount() {
    const { navigation } = this.props;
    const { onUpdate, needUpdate, payload, data } = _.get(navigation, 'state.params.navParam');

    if (needUpdate && data.read_status === '0') {
      this.updateRecord(payload, onUpdate);
    }
  }

  updateRecord = async (payload, callback = () => null) => {
    const data = await RecordService.updateNotice(payload);
    if (data) {
      callback();
    }
  };

  listTag = (value) => {
    if (value === '1') {
      return (
        <Badge danger>
          <Text>{I18n.t('import')}</Text>
        </Badge>
      );
    }
    return (
      <Badge warning>
        <Text>{I18n.t('general')}</Text>
      </Badge>
    );
  };

  noticeDetail = () => {
    const { navigation } = this.props;
    const data = _.get(navigation, 'state.params.navParam.data');
    return (
      <View>
        <Text style={styles.title}>{data.name}</Text>
        <View style={styles.subTitle}>
          {this.listTag(data.priority)}
          <Text style={{ marginLeft: 10 }}>
            {moment.unix(data.publish_date / 1000).format('YYYY-MM-DD HH:mm')}
          </Text>
        </View>
        <Text style={styles.description}>{data.description}</Text>
        {!_.isEmpty(data.attachment) && (
          <View>
            <ListItem />
            <AttachmentItem
              title="附件"
              pageType="detail"
              style={{ flex: 1 }}
              data={data.attachment}
              navigation={navigation}
            />
          </View>
        )}
      </View>
    );
  };

  renderContent = () => {
    const { navigation } = this.props;
    const data = _.get(navigation, 'state.params.navParam.data');

    if (_.isEmpty(data)) {
      return <ErrorScreen />;
    }

    return <Content style={{ backgroundColor: themes.fill_base }}>{this.noticeDetail()}</Content>;
  };

  render() {
    const { navigation } = this.props;

    return (
      <Container style={{ backgroundColor: themes.fill_base }}>
        <StyledHeader>
          <Left style={{ flex: 1 }}>
            <Button transparent onPress={() => navigation.goBack()}>
              <Icon name="ios-arrow-back" style={styles.icon} />
            </Button>
          </Left>
          <Body style={{ flex: 1, alignItems: 'center' }}>
            <Title
              style={{
                color: themes.title_text_color,
                fontSize: themes.title_size,
              }}
            >
              {I18n.t('notice_detail')}
            </Title>
          </Body>
          <Right />
        </StyledHeader>
        {this.renderContent()}
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  icon: {
    color: themes.title_icon_color,
    fontSize: themes.font_header_size,
  },
  title: {
    textAlign: 'left',
    fontSize: 24,
    padding: 10,
  },
  subTitle: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 10,
    marginLeft: 5,
  },
  description: {
    padding: 10,
  },
});
