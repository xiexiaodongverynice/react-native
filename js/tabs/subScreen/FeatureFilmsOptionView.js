/*
 * Created by Uncle Charlie, 2017/12/22
 * @flow
 */

import React from 'react';
import { FlatList, Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import _ from 'lodash';
import { Body, Button, Container, Content, Header, Icon, Left, Right, Title } from 'native-base';
import { HeaderLeft, ListDivider, StyledHeader } from '../common/components';
import I18n from '../../i18n';
import themes from '../common/theme';

type Prop = {
  onComponentDidMount: void,
  onComponentUnMount: void,
  navigation: {
    navigate: (screen: string) => void,
    state: {
      params: {
        callback: void,
        multipleSelect: boolean,
        options: Array,
        otherDatas: any,
        pageType: 'add' | 'edit' | 'detail',
      },
    },
  },
};

type State = {
  played: Array<any>,
};

export default class CommonOptionView extends React.Component<Prop, State> {
  state = {
    played: this.props.navigation.state.params.otherDatas || [],
  };

  pageType = this.props.navigation.state.params.pageType;

  componentDidMount() {
    const { onComponentDidMount } = this.props;
    if (_.isFunction(onComponentDidMount)) {
      onComponentDidMount(this.refresh);
    }
  }

  componentWillUnmount() {
    const { onComponentUnMount } = this.props;
    if (_.isFunction(onComponentUnMount)) {
      onComponentUnMount();
    }
  }

  handleSelection = (item) => {
    const { navigation } = this.props;
    const {
      params: { callback, options, pageType },
    } = navigation.state;
    const { played } = this.state;

    if (pageType === 'detail') {
      return;
    }

    const mediaPlayed = played.some(
      (e) => e.id == item.id || _.get(e, 'clm_presentation') === item.id,
    );

    navigation.navigate('Detail', {
      navParam: {
        id: item.id,
        objectApiName: 'clm_presentation',
        record_type: 'master',
        filmCallback: (id) => {
          if (played.every((e) => e.id !== id && !mediaPlayed)) {
            const selectd = _.find(options, (e) => e.id === id);
            callback(id, selectd.name);
            played.push({ id, name: selectd.name });
            this.setState({ played });
            // if (this.pageType === 'edit') {
            //   //* 创建feacallback
            // }
          }
        },
      },
    });
  };

  renderItem = ({ item }) => {
    const {
      navigation: { state },
    } = this.props;

    const { played } = this.state;
    const mediaPlayed = played.some(
      (e) => e.id == item.id || _.get(e, 'clm_presentation') === item.id,
    );
    const key = item.value ? `${item.value}` : `${item.id}`;

    return (
      <View key={key} style={styles.item}>
        <TouchableOpacity
          onPress={() => this.handleSelection(item, mediaPlayed)}
          style={{
            flex: 1,
            justifyContent: 'space-between',
            alignItems: 'stretch',
            flexDirection: 'row',
          }}
        >
          <Text style={styles.text}>{item.name}</Text>
          {mediaPlayed ? (
            <Text style={styles.tip}>{I18n.t('FeatureFilmsOptionView.Played')}</Text>
          ) : null}
        </TouchableOpacity>
      </View>
    );
  };

  render() {
    const { navigation } = this.props;
    const {
      params: { options },
    } = navigation.state;
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
              {I18n.t('common_options')}
            </Title>
          </Body>
          <Right />
        </StyledHeader>
        <Content>
          {options.length > 0 ? (
            <FlatList data={options} extraData={this.state} renderItem={this.renderItem} />
          ) : (
            <View style={themes.noDataCenter}>
              <Text>{I18n.t('FeatureFilmsOptionView.NoMediaData')}</Text>
            </View>
          )}
        </Content>
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  item: {
    padding: 10,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    borderBottomWidth: themes.regular_border_width,
    borderBottomColor: themes.border_color_base,
  },
  text: {
    textAlign: 'left',
    textAlignVertical: 'center',
  },
  tip: {
    textAlign: 'right',
    textAlignVertical: 'center',
    color: themes.color_text_placeholder,
  },
});
