/**
 *Created by Guanghua on 01/02;
 @flow
 */
import React from 'react';
import {
  Container,
  Header,
  Content,
  ListItem,
  Text,
  Badge,
  Left,
  Body,
  Right,
  Button,
  Icon,
  Title,
} from 'native-base';
import _ from 'lodash';
import moment from 'moment';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import I18n from '../../i18n';
import { HeaderLeft, StyledHeader } from '../common/components';
import themes from '../common/theme';
import { getQueryInitialState } from '../common/helpers/QueryHelper';
import { queryMultipleRecordList, clearQuery } from '../../actions/query';
import NoDataPlaceholder from '../../components/common/NoDataPlaceholder';

type Prop = {
  navigation: any,
  actions: any,
  token: string,
  homeData: any,
  userInfo: any,
  crmPowerSetting: any,
};

type State = {};

class NoticeListScreen extends React.Component<Prop, State> {
  componentDidMount() {
    this.refresh();
  }

  listTag = (value) => {
    if (value === '1') {
      return (
        <Badge danger style={{ alignSelf: 'auto' }}>
          <Text>{I18n.t('import')}</Text>
        </Badge>
      );
    }
    return (
      <Badge warning style={{ alignSelf: 'auto' }}>
        <Text>{I18n.t('general')}</Text>
      </Badge>
    );
  };

  renderReadStatusLabel = (value) => (
    <Badge danger={value === '0'} success={value === '1'} style={{ alignSelf: 'auto' }}>
      <Text>{I18n.t(value === '0' ? 'unread' : 'read')}</Text>
    </Badge>
  );

  openNotice = (data) => {
    const { userInfo, crmPowerSetting, navigation } = this.props;
    const payload = {
      head: {
        token: global.FC_CRM_TOKEN,
      },
      body: {
        user_info: userInfo.id,
        notice: data.id,
      },
    };

    navigation.navigate('NoticeDetail', {
      navParam: {
        data,
        onUpdate: this.refresh,
        needUpdate: crmPowerSetting.need_notice_read_log === true, // 不要给 needUpdate 赋默认值，业务对所有类型的值都有意义
        payload,
      },
    });
  };

  renderContent = () => {
    const { navigation, homeData } = this.props;
    const data = _.get(navigation, 'state.params.navParam') || _.get(homeData[0], 'result', []);

    if (_.isEmpty(data)) {
      return <NoDataPlaceholder text={I18n.t('no_data_notice')} />;
    }

    const noticeList = _.map(data, (item) => (
      <View key={`${item.id}`}>
        <ListItem>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.list}
            onPress={() => this.openNotice(item)}
          >
            {this.listTag(item.priority)}
            <View style={{ marginHorizontal: 5, flex: 1 }}>
              {/* Maybe we should use Text in React-Native instead of Native-Base */}
              <Text style={{ alignSelf: 'auto' }}>{item.name}</Text>
              <Text style={styles.publishDate}>
                {I18n.t('publish_date')}：
                {moment.unix(item.publish_date / 1000).format('YYYY-MM-DD HH:mm')}
              </Text>
            </View>
            {this.renderReadStatusLabel(item.read_status)}
          </TouchableOpacity>
        </ListItem>
      </View>
    ));
    return <Content>{noticeList}</Content>;
  };

  refresh = () => {
    const { token, actions } = this.props;
    const payload = {
      head: { token },
      body: [
        {
          objectApiName: 'notice',
          criterias: [
            {
              field: 'profiles',
              operator: 'contains',
              value: ['$$CurrentProfileId$$'],
            },
            // {
            //   field: 'expire_date',
            //   operator: '>',
            //   value: [new Date().getTime()],
            // },
          ],
          orderBy: 'publish_date',
          order: 'desc',
          joiner: 'and',
          pageSize: 100,
          pageNo: 1,
        },
      ],
    };
    actions.queryMultipleRecordList(payload);
  };

  render() {
    const { navigation } = this.props;

    return (
      <Container style={{ backgroundColor: themes.fill_base }}>
        <StyledHeader>
          {_.get(navigation, 'state.params.navParam') ? (
            <HeaderLeft navigation={navigation} />
          ) : (
            <Left style={{ flex: 1 }}>
              <Button transparent onPress={() => this.props.navigation.navigate('DrawerOpen')}>
                <Icon name="menu" style={styles.icon} />
              </Button>
            </Left>
          )}

          <Body style={{ flex: 1, alignItems: 'center' }}>
            <Title
              style={{
                color: themes.title_text_color,
                fontSize: themes.title_size,
              }}
            >
              {I18n.t('notice_list')}
            </Title>
          </Body>
          <Right />
        </StyledHeader>
        {this.renderContent()}
      </Container>
    );
  }
}

const select = (state, screen) => {
  const query = getQueryInitialState({ state, screen });
  return {
    token: state.settings.token,
    userInfo: state.settings.userInfo,
    crmPowerSetting: state.settings.crmPowerSetting,
    objectDescription: state.settings.objectDescription,
    profile: state.settings.profile,
    permission: state.settings.permission,
    homeData: _.get(query.data, 'batch_result', []),
    dataLoading: query.loading,
    dataError: query.error,
  };
};

const act = (dispatch, { navigation }) => {
  const key = _.get(navigation, 'state.key');
  return {
    actions: bindActionCreators(
      {
        queryMultipleRecordList: queryMultipleRecordList(key),
        clearQuery: clearQuery(key),
      },
      dispatch,
    ),
    dispatch,
  };
};

export default connect(select, act)(NoticeListScreen);

const styles = StyleSheet.create({
  list: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  publishDate: {
    alignSelf: 'auto',
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  icon: {
    color: themes.title_icon_color,
    fontSize: themes.font_header_size,
  },
});
