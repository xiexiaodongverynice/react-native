import React from 'react';
import { Platform } from 'react-native';
import Input from '../../../lib/Input';

export default class DisRenderInput extends React.Component {
  shouldComponentUpdate(nextProps) {
    return Platform.OS !== 'ios';
  }

  render() {
    const props = this.props;
    return <Input {...props} />;
  }
}
