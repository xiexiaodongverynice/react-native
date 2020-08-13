//@flow
import React from 'react';
import { Text, View } from 'react-native';
import VerticalSpacer from '../../../components/common/VerticalSpacer';

type typeProps = {
  label: string,
  content: string,
  style: any,
};

//共两行文字，上面是label（加粗），下面是content
export default function TextBlockField(props: typeProps) {
  return (
    <View style={[styles.flexDirectionCol, props.style]}>
      <Text style={[styles.color333, styles.fontSize15, styles.textAlignCenter, styles.width100]}>
        {props.content}
      </Text>
      <VerticalSpacer height={5} />
      <Text style={[styles.color666, styles.fontSize12, styles.textAlignCenter, styles.width100]}>
        {props.label}
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
  fontSize15: {
    fontSize: 15,
  },
  fontSize12: {
    fontSize: 12,
  },
  flexDirectionCol: {
    flexDirection: 'column',
  },
  textAlignCenter: {
    textAlign: 'center',
  },
  width100: {
    width: '100%',
  },
};
