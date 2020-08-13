//@flow

import React, { Component } from 'react';
import { View, Text } from 'react-native';
import IconGender from '../../../components/common/IconGender';
import HorizontalSpacer from '../../../components/common/HorizontalSpacer';

type typeProps = {
  name: string,
  gender: string,
  content: string,
};

export default function NameGenderContent(props: typeProps) {
  const icon = <IconGender gender={props.gender} size={14} />;
  const iconWrapper = icon ? <View style={[styles.center, styles.width24px]}>{icon}</View> : null;
  const leftPlaceholder = icon ? <View style={styles.width24px} /> : null;
  return (
    <View>
      <View style={[styles.center]}>
        <View style={styles.flexDirectionRow}>
          {leftPlaceholder}
          <Text style={[styles.fontSize18, styles.fontWeightBold, styles.color333]}>
            {props.name}
          </Text>
          {iconWrapper}
        </View>
      </View>
      <Text style={[styles.color666, styles.fontSize14, styles.textAlignCenter]}>
        {props.content}
      </Text>
    </View>
  );
}

const styles = {
  color333: {
    color: '#333333',
  },
  color666: {
    color: '#666666',
  },
  fontWeightBold: {
    fontWeight: 'bold',
  },
  fontSize18: {
    fontSize: 18,
  },
  fontSize14: {
    fontSize: 14,
  },
  flexDirectionRow: {
    flexDirection: 'row',
  },
  textAlignCenter: {
    textAlign: 'center',
  },
  width100: {
    width: '100%',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  width24px: {
    width: 24,
  },
};
