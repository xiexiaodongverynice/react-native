/*  eslint-disable */
import React, { PureComponent } from 'react';
import { View, TextInput, Animated, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

//label只有2种状态，borderColor有3种状态
const styleSuit_LoginScreen = {
  styles: StyleSheet.create({
    //容器有底部横线
    container: {
      paddingTop: 26, //paddingTop用于放置label
      width: '100%', //非常重要，如果不设置宽度，会变成0x0
      borderBottomWidth: 1,
      // backgroundColor: '#33333333', //调试用
    },
    label: {
      position: 'absolute',
      left: 0,
      // borderWidth:1,
    },
    input: {
      height: 32,
      // backgroundColor:'red'
    },
  }),

  emptyBorderColor: '#eeeeee',//未输入、空白状态
  editingBorderColor: '#4A8FEC',//编辑中，可能有输入也可能无输入
  inputedBorderColor: '#999999',//已输入

  //inactive时，label颜色是灰色；label距顶部18；label fontSize就是placeholder大小
  //active时  ，label颜色是黑色；label距顶部0； label fontSize变小
  inactiveLabelStyle: {
    color: '#999999',
    top: 26, //等于paddingTop
    fontSize: 14,
    lineHeight: 32,
  },
  activeLabelStyle: {
    color: '#333333',
    top: 0,
    fontSize: 16,
    lineHeight: 26,
  },
};

//传入的props都会原样传入 TextInput
//不需要placeholder！！
class FloatTextInput extends PureComponent {
  static defaultProps = {};

  static propTypes = {
    value: PropTypes.string.isRequired, //就是TextInput.value，必须用controlled components技术实现 single truth
    label: PropTypes.string.isRequired, //仅当前组件使用，不会传给children
    styleSuitName: PropTypes.string.isRequired, //指定styleSuit，仅当前组件使用
  };

  constructor(props) {
    super(props);

    if (this.props.styleSuitName === 'LoginScreen') {
      this.styleSuit = styleSuit_LoginScreen;
    } else {
      alert('must provide styleSuitName');
    }
    this.state = {
      isFocused: false,
    };
    const isActive = FloatTextInput.isActiveWithPropsState(this.props, this.state);
    const resolvedAnimatedValue = FloatTextInput.resolvedAnimatedValue_with_isActive(isActive);
    this.animatedValue = new Animated.Value(resolvedAnimatedValue);

    const inactiveLabelStyle = this.styleSuit.inactiveLabelStyle;
    const activeLabelStyle = this.styleSuit.activeLabelStyle;
    this.animatedLabelStyle = {
      top: this.animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [inactiveLabelStyle.top, activeLabelStyle.top],
      }),
      fontSize: this.animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [inactiveLabelStyle.fontSize, activeLabelStyle.fontSize],
      }),
      color: this.animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [inactiveLabelStyle.color, activeLabelStyle.color],
      }),
      lineHeight: this.animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [inactiveLabelStyle.lineHeight, activeLabelStyle.lineHeight],
      }),
    };
  }

  componentDidUpdate(prevProps, prevState) {
    const isActive_prev = FloatTextInput.isActiveWithPropsState(prevProps, prevState);
    const isActive_now = FloatTextInput.isActiveWithPropsState(this.props, this.state);

    if (isActive_now === isActive_prev) {
      return;
    }
    const resolvedAnimatedValue = FloatTextInput.resolvedAnimatedValue_with_isActive(isActive_now);
    Animated.timing(this.animatedValue, {
      toValue: resolvedAnimatedValue,
      duration: 200,
    }).start();
  }

  //  当前的input是否 active？ 输入中或已输入，显示active(黑色）
  static isActiveWithPropsState(props, state) {
    const hasValue = !!props.value;
    const isActive = state.isFocused || hasValue; //输入中，或已输入，显示active(黑色）
    return isActive;
  }

  //返回this.animatedValue的解析后值
  static resolvedAnimatedValue_with_isActive(isActive) {
    return isActive ? 1 : 0;
  }

  getBorderColor(){
    if (this.state.isFocused){
      return  this.styleSuit.editingBorderColor
    } else if (this.props.value.length){
      return this.styleSuit.inputedBorderColor
    } else {
      return this.styleSuit.emptyBorderColor
    }
  }

  render() {
    const styles = this.styleSuit.styles;
    const borderColor = this.getBorderColor();
    const onFocus = ()=>{
      this.setState({ isFocused: true })
      if (this.props.onFocus){
        this.props.onFocus()
      }
    }

    const onBlur = ()=>{
      this.setState({ isFocused: false })
      if (this.props.onBlur){
        this.props.onBlur()
      }
    }
    return (
      <View style={[styles.container, { borderColor }]}>
        <TextInput
          {...this.props}
          style={styles.input}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        <Animated.Text style={[styles.label, this.animatedLabelStyle]}>
          {this.props.label}
        </Animated.Text>
      </View>
    );
  }
}

export default FloatTextInput;
