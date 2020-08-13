/**
 * Created by Uncle Charlie, 2018/03/14
 * @flow
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ListItem, Body, Left, Right, Icon } from 'native-base';
import _ from 'lodash';
import { TipContent, TipIcon } from '../../components/formComponents/common';
import HtmlComponent from './components/HtmlComponent';
import detailScreen_styles from '../../styles/detailScreen_styles';

type Prop = {
  token: string,
  render: ?(title: string, data: any, desc: any, token: string) => any,
  desc: any,
  title: any,
  data: any,
  field: any,
  navigation: ?any,
  renderType: ?string,
  parentData: any,
  hasParent: any,
};

export default class DetailListItem extends React.PureComponent<Prop, {}> {
  state = {
    showTipContent: false,
  };

  toUrl = (data) => {
    if (!data) return false;
    const { navigation } = this.props;
    navigation.navigate('Web', { mediaUrl: data });
  };

  onLinkToDetail = () => {
    const { navigation, parentData } = this.props;
    const parentId = _.get(parentData, 'id');
    const recordType = _.get(parentData, 'record_type');
    const objectApiName = _.get(parentData, 'object_describe_name');
    navigation.navigate('Detail', {
      navParam: {
        objectApiName,
        record_type: recordType,
        id: parentId,
      },
    });
  };

  executeRender = () => {
    const { render, token, desc, title, renderType, hasParent, field } = this.props;
    let { data } = this.props;
    const isLink = _.get(field, 'is_link', false);
    const record = _.chain(desc)
      .result('options')
      .find({
        value: data,
      })
      .value();
    if (record) {
      data = _.get(record, 'label');
    }

    if (render && _.isFunction(render)) {
      return render(title, data, desc, token);
    }

    if (renderType && renderType === 'inner_html') {
      return (
        <Body style={{ flex: 2 }}>
          <HtmlComponent
            html={data || ''}
            textStyle={detailScreen_styles.rightTextStyle}
            navigation={this.props.navigation}
          />
        </Body>
      );
    }
    if (renderType && renderType === 'url') {
      return (
        <Body style={{ flex: 2 }}>
          <Text
            onPress={() => {
              this.toUrl(data);
            }}
            style={{ flex: 1, textAlign: 'right', fontSize: 13, color: '#333333' }}
          >
            {data || _.isNumber(data) ? _.toString(data) : ''}
          </Text>
        </Body>
      );
    }
    if (renderType && renderType === 'long_text') {
      return (
        <Body style={{ flex: 2 }}>
          <Text
            style={{
              flex: 1,
              paddingTop: 5,
              paddingBottom: 5,
              marginLeft: 50,
              textAlign: 'right',
              fontSize: 13,
              color: '#333333',
            }}
          >
            {data || _.isNumber(data) ? _.toString(data) : ''}
          </Text>
        </Body>
      );
    }

    return (
      <Body style={{ flex: 2 }}>
        {isLink && hasParent ? (
          <Text
            style={{ flex: 1, textAlign: 'right', fontSize: 13, color: '#333333' }}
            onPress={() => this.onLinkToDetail()}
          >
            {data || _.isNumber(data) ? _.toString(data) : ''}
          </Text>
        ) : (
          <Text style={{ flex: 1, textAlign: 'right', fontSize: 13, color: '#333333' }}>
            {data || _.isNumber(data) ? _.toString(data) : ''}
          </Text>
        )}
      </Body>
    );
  };

  checkTip = () => {
    const { field } = this.props;
    const _hint = _.get(field, 'tip.hint', '');
    if (_hint && _.isString(_hint)) {
      return _hint;
    }
    return false;
  };
  render() {
    const { title, desc, renderType } = this.props;
    const { showTipContent } = this.state;
    const tip = this.checkTip();
    const tiPkey = `tip-${_.get(desc, 'id') || _.get(desc, 'api_name') || ''}`;
    return (
      <View
        key={`wrap-${_.get(desc, 'id') || _.get(desc, 'api_name')}|| ''`}
        style={{ backgroundColor: '#ffffff' }}
      >
        <ListItem
          style={{
            alignItems: renderType === 'long_text' ? 'stretch' : 'center',
            borderColor: '#ffffff',
          }}
          key={`content-${_.get(desc, 'id') || _.get(desc, 'api_name')}|| ''`}
        >
          {renderType !== 'long_text' ? (
            <Left style={{ alignItems: 'center' }}>
              <Text style={{ width: 100, fontSize: 13, color: '#666666' }}>{title}</Text>
              {tip ? (
                <TipIcon
                  onPress={() => {
                    this.setState({ showTipContent: !showTipContent });
                  }}
                />
              ) : null}
            </Left>
          ) : (
            <View style={{ flexDirection: 'row', marginTop: 5 }}>
              <Text style={{ width: 100, fontSize: 13, color: '#666666' }}>{title}</Text>
              {tip ? (
                <TipIcon
                  onPress={() => {
                    this.setState({ showTipContent: !showTipContent });
                  }}
                />
              ) : null}
            </View>
          )}
          {this.executeRender()}
        </ListItem>
        {showTipContent ? <TipContent text={tip} key={tiPkey} /> : null}
      </View>
    );
  }
}
