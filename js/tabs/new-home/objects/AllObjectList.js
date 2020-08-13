/**
 * @flow
 */
import React, { Component } from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import { Container, Header, Text, Left, Body, Right, Button, Icon } from 'native-base';
import { View, StyleSheet, ScrollView } from 'react-native';
import themes from '../../common/theme';
import { MainList } from '../helper/renderListHelper';
import { StyledHeader } from '../../common/components';

type Props = {
  content: object,
  navigation: Object,
  parentParam: object,
  queryConditions: object,
  queryState: boolean,
  computedHomeData: Array,
  onMainListItemUpdate: void,
};
class AllObjectList extends Component<Props> {
  componentDidMount() {
    //以后还要做下拉刷新，优化首页加载逻辑。
  }

  render() {
    const { navigation, computedHomeData = [] } = this.props;
    const params = _.get(navigation, 'state.params', {});
    const { itemApiName = '', itemName = '', onItemUpdate } = params;
    const data = (computedHomeData.find((list) => list.api_name === itemApiName) || []).dataList;

    return (
      <Container style={{ backgroundColor: themes.fill_base }}>
        <StyledHeader>
          <Left style={{ flex: 1 }}>
            <Button transparent onPress={() => navigation.goBack()}>
              <Icon name="ios-arrow-back" style={styles.icon} />
            </Button>
          </Left>
          <Body style={{ flex: 1, alignItems: 'center' }}>
            <Text
              style={{
                fontSize: themes.font_size_heading,
                fontWeight: 'bold',
                color: themes.title_text_color,
              }}
            >
              {itemName}
            </Text>
          </Body>
          <Right />
        </StyledHeader>
        <ScrollView>
          {_.isEmpty(params) ? (
            <View />
          ) : (
            <MainList
              {...params}
              itemDataList={data}
              navigation={navigation}
              isLimit={false}
              onItemUpdate={onItemUpdate}
            />
          )}
        </ScrollView>
      </Container>
    );
  }
}

const select = (state) => ({
  computedHomeData: _.get(state.home, 'computedHomeData'),
});
export default connect(select)(AllObjectList);

const styles = StyleSheet.create({
  icon: {
    color: themes.title_icon_color,
    fontSize: themes.font_header_size,
  },
  lineSpace: {
    backgroundColor: '#FAFAFA',
    paddingBottom: 10,
  },
});
