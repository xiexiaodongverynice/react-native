/**
 * * 简单的表单控件
 * @flow
 */

import React from 'react';
import _ from 'lodash';
import { TouchableOpacity, Text } from 'react-native';
import { ListItem, Body, Icon, View } from 'native-base';
import HtmlComponent from '../../tabs/common/components/HtmlComponent';
import { StyledSeparator } from '../../tabs/common/components';
import I18n from '../../i18n';

type Type = {
  text: string,
  key: string,
};

const TipContent = ({ text = '', key = '' }: Type) => (
  <ListItem
    style={{
      borderWidth: 0,
      borderColor: '#fff',
      marginLeft: 0,
      backgroundColor: '#FCF8E3',
      paddingLeft: 15,
      paddingTop: 10,
      paddingBottom: 10,
    }}
    key={key}
  >
    <View style={{ color: '#F6B229', fontSize: 13 }}>
      <HtmlComponent html={text || ''} />
    </View>
  </ListItem>
);

const TipIcon = ({ onPress = () => {}, style = {} }: { onPress: any, style: object }) => (
  <TouchableOpacity onPress={onPress} style={{ ...style, marginLeft: 3, paddingRight: 10 }}>
    <Icon name="ios-information-circle-outline" style={{ color: '#F6B229', fontSize: 20 }} />
  </TouchableOpacity>
);

const SectionSeparator = ({ header, nums }: { header: string, nums: number }) => (
  <StyledSeparator key={header || ''}>
    {_.isUndefined(nums) ? (
      <Text>{header || ''}</Text>
    ) : (
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginRight: 13 }}>
        <Text>{header || ''}</Text>
        <Text>{I18n.t('List.TotalNItems').replace('%d', nums)}</Text>
      </View>
    )}
  </StyledSeparator>
);

export { TipContent, TipIcon, SectionSeparator };
