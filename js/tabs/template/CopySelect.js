/**
 * Created by gao
 * @flow
 */

import React from 'react';
import { Text } from 'react-native';
import * as _ from 'lodash';
import { Title, Content, Button, Container } from 'native-base';
import { HeaderLeft, StyledBody, HeaderRight, StyledHeader } from '../common/components';
import themes from '../common/theme';

type Props = {
  navigation: Object,
  dispatch: Function,
  screen: Object,
};

export default class CopySelect extends React.PureComponent<Props> {
  data: any = undefined;
  recordType: any = undefined;
  token: any = undefined;

  copyExist() {
    const { navigation } = this.props;
    const params = _.get(this.props, 'navigation.state.params.navParam');
    navigation.navigate('SelectList', {
      navParam: params,
    });
  }

  copyNew() {
    const { navigation } = this.props;
    const params = _.get(this.props, 'navigation.state.params.navParam');
    const { item, record_type } = params;
    navigation.navigate('Create', {
      navParam: {
        refObjectApiName: 'call_template',
        targetRecordType: 'week',
        templateDataRecordType: record_type,
        templateCopyItem: item,
        needReturn: true,
      },
    });
  }

  render() {
    const { navigation, dispatch, screen } = this.props;
    return (
      <Container>
        <StyledHeader>
          <HeaderLeft
            style={{ flex: 1 }}
            navigation={navigation}
            dispatch={dispatch}
            screen={screen}
          />
          <StyledBody>
            <Title
              style={{
                color: themes.title_text_color,
                fontSize: themes.title_size,
              }}
            >
              复制拜访
            </Title>
          </StyledBody>
          <HeaderRight />
        </StyledHeader>
        <Content>
          <Button
            full
            light
            style={{ borderBottomColor: 'gray', borderBottomWidth: 1 }}
            onPress={() => this.copyExist(this)}
          >
            <Text>复制到已有模板</Text>
          </Button>

          <Button full light onPress={() => this.copyNew(this)}>
            <Text>复制到新模板</Text>
          </Button>
        </Content>
      </Container>
    );
  }
}
