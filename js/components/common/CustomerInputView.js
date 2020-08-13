/**
 * * common input
 * @flow
 */
import React from 'react';
import * as _ from 'lodash';
import Input from '../../lib/Input';
import themes from '../../tabs/common/theme';
import I18n from '../../i18n';

type CustomerInputViewProps = {
  value: string,
  handleChangeText: (val: string) => void,
  type: string,
  placeholder: string,
  disabled: boolean,
};

const NUMBER_TYPE = ['real_number', 'big_int'];

class CustomerInputView extends React.Component<CustomerInputViewProps> {
  constructor(props) {
    super(props);

    this.defaultValue = props.value;
  }

  state = {
    inputKey: 0,
  };

  render() {
    const {
      placeholder = I18n.t('Input.Enter'),
      disabled = false,
      type = 'text',
      handleChangeText,
    } = this.props;

    const _handleChange = (val: string) => {
      let resultValue = val;
      if (NUMBER_TYPE.includes(type) && !_.isNaN(parseFloat(resultValue))) {
        resultValue = parseFloat(resultValue);
      }
      if (handleChangeText) {
        handleChangeText(resultValue);
      }
    };

    return (
      <Input
        key={this.state.inputKey}
        ref={(input) => {
          this.input = input;
        }}
        underlineColorAndroid="transparent"
        style={{
          lineHeight: 15,
          fontSize: themes.font_size_base,
        }}
        disabled={disabled}
        placeholder={disabled ? '' : placeholder}
        keyboardType={NUMBER_TYPE.includes(type) ? 'numeric' : 'default'}
        defaultValue={this.defaultValue}
        onChangeText={_handleChange}
      />
    );
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.value && !nextProps.value) {
      this.defaultValue = '';
      this.setState({
        inputKey: this.state.inputKey + 1,
      });
    }
  }

  shouldComponentUpdate(nextProps) {
    return this.props.value && !nextProps.value;
  }

  // componentDidUpdate() {
  //   this.input._root.focus();
  // }
}

export default CustomerInputView;
