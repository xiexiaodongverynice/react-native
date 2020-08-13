/**
 * Updated by Uncle Charlie, 2018/03/12
 */

import React from 'react';
import { View, Text, SectionList, ScrollView, StyleSheet } from 'react-native';
import { Content, Container, List, ListItem, Separator, Body, Label } from 'native-base';
import LoadingScreen from '../common/LoadingScreen';
import * as _ from 'lodash';
import themes from '../common/theme';

type Prop = {
  result: string,
};

type State = {
  result: Array,
};

export default class CoachResultView extends React.Component<Prop, State> {
  state: State = {
    result: [],
  };

  componentDidMount() {
    const { result } = this.props;
    const resultObject = _.isEmpty(result) ? [] : JSON.parse(result);
    this.setState({ result: resultObject });
  }

  renderResultView = (evaluation) => {
    if (typeof evaluation === 'string') {
      return (
        <Text
          style={{
            height: 15,
            fontSize: themes.font_size_base,
            color: themes.color_text_base,
          }}
        >
          evaluation
        </Text>
      );
    } else {
      const result = [];
      _.forEach(evaluation, (section) => {
        let panel = (
          <View
            style={{
              backgroundColor: themes.fill_base,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: themes.fill_grey,
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  color: themes.color_text_base,
                  fontSize: themes.font_size_subhead,
                  padding: 10,
                }}
              >
                {_.get(section, 'title')}
              </Text>
            </View>
            <View
              style={{
                padding: 10,
                backgroundColor: themes.fill_base,
              }}
            >
              {this.renderItems(section)}
            </View>
          </View>
        );
        result.push(panel);
      });

      return result;
    }
  };

  renderItems = (section) => {
    let items = [];
    _.chain(_.get(section, 'items'))
      .filter((item) => {
        return item.label !== 'final_value';
      })
      .forEach((item) => {
        items.push(
          <View
            style={{
              backgroundColor: themes.fill_base,
            }}
          >
            <Text
              style={{
                color: themes.color_text_base,
                fontSize: themes.font_size_base,
                fontWeight: 'bold',
                padding: 5,
              }}
            >
              {_.get(item, 'label')}
            </Text>
            <Text
              style={{
                color: themes.color_text_base,
                fontSize: themes.font_size_caption_sm,
                padding: 10,
              }}
            >
              {_.get(item, 'value')}
            </Text>
          </View>,
        );
      })
      .value();
    return items;
  };

  render() {
    const { result } = this.state;
    if (_.isEmpty(result)) {
      return null;
    }

    return <Content>{this.renderResultView(result)}</Content>;
  }
}
