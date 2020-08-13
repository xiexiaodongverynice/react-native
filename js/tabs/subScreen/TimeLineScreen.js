/**
 * @flow
 */

import React from 'react';
import _ from 'lodash';
import { Text, View, StyleSheet, Alert, Modal, TouchableOpacity } from 'react-native';
import {
  Button,
  Container,
  Content,
  List,
  ListItem,
  Icon,
  Header,
  Spinner,
  Left,
  Right,
  Body,
  Title,
} from 'native-base';
import { StyledContainer, StyledHeader } from '../common/components';
import themes from '../common/theme';
import TimeLine from '../../utils/TimeLine';
import ApprovalDetail from '../../components/approval/approvalDetail';
import I18n from '../../i18n';

type Props = {
  navigation: {
    goBack: () => void,
    state: { params: { data: any, type: ?string } },
  },
};

const TimeLineScreen = (props: Props) => {
  const { navigation } = props;
  const {
    state: { params },
  } = navigation;
  const data = _.get(params, 'data', []);
  const type = _.get(params, 'type');

  const _renderDetail = (data) => {
    if (_.isEmpty(type)) {
      return null;
    } else if (type === 'approval') {
      return <ApprovalDetail data={data} />;
    }
  };

  return (
    <StyledContainer style={{ backgroundColor: themes.fill_base }}>
      <StyledHeader>
        <Left style={{ flex: 1 }}>
          <Button transparent onPress={() => navigation.goBack()}>
            <Icon
              name="ios-arrow-back"
              style={{
                color: themes.title_icon_color,
                fontSize: themes.font_header_size,
              }}
            />
          </Button>
        </Left>
        <Body style={{ flex: 1, alignItems: 'center' }}>
          <Title
            style={{
              color: themes.title_text_color,
              fontSize: themes.title_size,
            }}
          >
            {I18n.t('TimeLineScreen.Header.Approval')}
          </Title>
        </Body>
        <Right style={{ flex: 1 }} />
      </StyledHeader>
      <Content>
        <TimeLine
          style={{ marginTop: 20 }}
          data={data}
          renderDetail={_renderDetail}
          innerCircle="dot"
        />
      </Content>
    </StyledContainer>
  );
};

export default TimeLineScreen;
