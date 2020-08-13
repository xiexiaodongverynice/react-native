/**
 * @flow
 * auto trim Input.
 * 对于双向绑定的场景无法使用本组件，因为对 onChange 的不断使用 trim
 * 会导致用户无法输入空格。
 * 对于此场景，暂时可以使用 debounce 的形式实现，在用户暂停输入 500ms 后触发
 * trim 事件。
 */
import React from 'react';
import { Input, Textarea } from 'native-base';
import _ from 'lodash';

type normalFn = () => void;
type Prop = {
  isTextarea: boolean,
  value: any,
  autoTrim: boolean,
  secureTextEntry: boolean,
  onChangeText: (val: string) => void,
  onChange: (e: Object) => void,
};
export default class extends React.Component<Prop> {
  static defaultProps = {
    isTextarea: false,
    autoTrim: false,
    secureTextEntry: false,
    onChangeText: () => null,
    onChange: () => null,
  };

  get isTwoWayBind(): boolean {
    const { value, onChange, onChangeText } = this.props;
    return !!(value && (onChange || onChangeText));
  }

  trimController = (baseFn: normalFn, debounceFn: normalFn, fn: normalFn) => {
    if (this.isTwoWayBind) {
      baseFn();
      debounceFn();
    } else {
      fn();
    }
  };

  onChangeText = (val: string) => {
    this.trimController(
      () => this.props.onChangeText(val),
      () => this.debounceOnChangeText(val),
      () => this.props.onChangeText(this.trimForString(val)),
    );
  };

  onChange = (e: Object) => {
    this.trimController(
      () => this.props.onChange(e),
      () => {
        const { nativeEvent, ...restOfE } = e;
        const ne = e.nativeEvent; // 原生事件的 nativeEvent 如果不临时保存，会立即被清空
        this.debounceOnChange({ nativeEvent: ne, ...restOfE });
      },
      () => this.props.onChange(this.trimForNativeEvent(e)),
    );
  };

  debounceOnChangeText = _.debounce(
    (val) => this.props.onChangeText(this.trimForString(val)),
    1200,
  );

  debounceOnChange = _.debounce((e) => this.props.onChange(this.trimForNativeEvent(e)), 1200);

  trimForString = (val: string) => val.trim();

  trimForNativeEvent = (e: Object) => {
    const value = e.nativeEvent.text.trim();
    const { nativeEvent, ...restOfE } = e;
    // eslint-disable-next-line no-unused-vars
    // Object from native can't be override as object from native has an enumerable key on the prototype chain.
    // so don't remove text due to eslint.
    const { text, ...restOfNativeEvent } = nativeEvent;
    return {
      ...restOfE,
      nativeEvent: {
        ...restOfNativeEvent,
        text: value,
      },
    };
  };

  render() {
    const { autoTrim, secureTextEntry, isTextarea } = this.props;
    const needTrim = autoTrim || !secureTextEntry;

    const newProps = needTrim
      ? { ...this.props, onChangeText: this.onChangeText, onChange: this.onChange }
      : this.props;
    const C = isTextarea ? Textarea : Input;
    return <C {...newProps} />;
  }
}
