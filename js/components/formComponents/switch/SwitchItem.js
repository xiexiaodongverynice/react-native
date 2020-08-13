/**
 * Created by Uncle Charlie, 2018/02/05
 * @flow
 */
import React from 'react';
import { View, Text, Switch } from 'react-native';
import _ from 'lodash';

const SwitchButton = ({
  disabled,
  onChange,
  value = false,
}: {
  disabled: boolean,
  onChange: void,
  value: any,
}) => <Switch disabled={disabled} onValueChange={onChange} value={value} />;

type GroupValue = {
  field: string,
  value: any,
};

type Prop = {
  field: any,
  disabled: boolean,
  disableField: boolean,
  options: Array<any>,
  onChange: (fieldValue: any) => void,
  value: string | boolean,
  handleSwtichChange: (fieldName: string, fieldValue: any) => void,
};

type State = {
  swtichValue: boolean,
};

export default class SwtichItem extends React.PureComponent<Prop, State> {
  componentDidMount() {
    const { onChange, value, field, handleSwtichChange } = this.props;
    if (onChange && _.isFunction(onChange) && _.isFunction(handleSwtichChange)) {
      setTimeout(() => {
        handleSwtichChange(_.get(field, 'field'), value);
        onChange(value);
      }, 0);
    }
  }

  handleChange = ({ field, value }: GroupValue) => {
    const { onChange, handleSwtichChange } = this.props;
    if (onChange) {
      onChange(value);
    }
    handleSwtichChange(field, value);
  };

  render() {
    const { field, disableField, options, disabled = false, value } = this.props;
    return (
      <View
        style={{
          flexDirection: 'row',
          flex: 1,
          alignSelf: 'stretch',
          justifyContent: 'flex-end',
        }}
      >
        {options && Array.isArray(options) ? (
          <SwitchButton
            disabled={disableField}
            value={value}
            onChange={(val) => {
              this.handleChange({
                field: _.get(field, 'field'),
                value: val,
              });
            }}
          />
        ) : (
          <Text>No options</Text>
        )}
      </View>
    );
  }
}
