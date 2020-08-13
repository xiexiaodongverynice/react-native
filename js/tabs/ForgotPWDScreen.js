//@flow
/* eslint-disable */

import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, BackHandler } from 'react-native';
import { connect } from 'react-redux';
import { Button, Spinner } from 'native-base';
import _ from 'lodash';
import I18n from '../i18n';
import { toastWaring } from '../utils/toast';
import themes from './common/theme';
import userService from '../services/userService';
import LoginBg from './LoginBg';
import FloatTextInput from '../components/formComponents/FloatTextInput';
import assert from '../utils/assert0';

const DEVICE_WIDTH = Dimensions.get('window').width;

type Prop = {
  handleChange: (islogin: boolean) => void,
  handleBack: () => void, //需要caller提供返回方法
  dispatch: (any) => void,
};

class ForgotPWDScreen extends React.Component<Prop, State> {
  timer: string = '';

  state = {
    second: 59, //剩余秒数
    timerRunning: false, //为true表示正在倒计时
    username: '',
    loading: false, //正在请求网络
    errMsg: '',
    succMsg: '',
  };

  componentWillUnmount() {
    this.removeTimer();
    this.removeBackHandlerListener.remove();
  }

  componentDidMount() {
    this.removeBackHandlerListener = BackHandler.addEventListener('hardwareBackPress', () => {
      this._backLogin();
      return true;
    });
  }

  async findPassword() {
    if (!_.size(this.state.username)) {
      toastWaring(I18n.t('username_is_require'), 2000, 30);
      return;
    }
    this.setState({ loading: true });

    try {
      const payload = {
        body: {
          loginId: this.state.username,
        },
      };
      const data = await userService.findPassword(payload);
      this.setState({ loading: false });
      if (data) {
        const succMsg = I18n.t('find_password_success_msg');
        const errMsg = '';
        this.setState({ succMsg, errMsg });
        this.startTimer();
      } else {
        const errMsg = I18n.t('find_password_fail_msg');
        this.removeTimer();
        this.setState({ errMsg });
      }
    } catch (e) {
      const errMsg = I18n.t('find_password_fail_msg');
      this.removeTimer();
      this.setState({ loading: false, errMsg });
    }
  }

  startTimer = () => {
    this.setState({ timerRunning: true });

    this.timer = setInterval(() => {
      if (this.state.second === 1) {
        this.removeTimer();
      } else {
        this.setState({ second: this.state.second - 1 });
        assert(this.state.second > 0);
      }
    }, 1000);
  };

  removeTimer = () => {
    clearInterval(this.timer);
    this.setState({ timerRunning: false, second: 59 });
  };

  _backLogin = () => {
    this.props.handleChange(true);
  };

  renderErrMsg() {
    const errMsg = this.state.errMsg;
    assert(_.isString(errMsg));
    if (errMsg.length > 0) {
      return (
        <View style={styles.errMsgWrapper}>
          <Text style={styles.errMsgText}>{errMsg}</Text>
        </View>
      );
    } else {
      return <View style={styles.errMsgWrapper} />;
    }
  }

  //返回大个Btn
  renderBigBtn() {
    const hasEntered = _.size(this.state.username);

    const enabled = !this.state.loading && !this.state.timerRunning; //虽然是灰色，但是仍然可以点，这样才可以看到I18n.t('username_is_require')
    const backgroundColor = hasEntered ? themes.fill_base_login : '#cccccd';
    const style = {
      height: 44,
      backgroundColor,
    };
    const spinner = this.state.loading ? (
      <Spinner color="#fff" style={{ position: 'absolute', left: DEVICE_WIDTH * 0.25 }} />
    ) : null;

    const textToDisplay = _.size(this.state.succMsg)
      ? this.state.succMsg
      : I18n.t('find_password_button');
    return (
      <Button style={style} block disabled={!enabled} onPress={() => this.findPassword()}>
        {spinner}
        <Text style={{ color: '#fff', fontSize: 14 }}>{textToDisplay}</Text>
      </Button>
    );
  }

  // 【返回首页】按钮，它需要包装在view内
  renderBtnRow() {
    const rowHeight = 42;
    const rowStyle = { height: rowHeight, flexDirection: 'row-reverse' };
    const btnStyle = [
      {
        flexDirection: 'row',
        alignItems: 'center',
      },
      styles.border1,
    ];
    return (
      <View style={rowStyle}>
        <TouchableOpacity
          onPress={() => {
            this._backLogin();
          }}
          style={btnStyle}
        >
          <Text style={{ color: '#4A8FEC', fontSize: 14 }}>
            {I18n.t('ForgotPWDScreen.ReturnToHome')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  //一个输入框，一个倒计时Text
  renderInputRow() {
    const remainingSecondsStr = `${this.state.second}s`; //剩余秒数
    const textStyle = { color: '#999999', fontSize: 14, lineHeight: 30 };
    const textElem = this.state.timerRunning ? (
      <Text style={[textStyle, styles.border1]} numberOfLines={1}>
        {remainingSecondsStr}
      </Text>
    ) : null;
    const rowStyle = { flexDirection: 'row', alignItems: 'baseline' };

    return (
      <View style={[rowStyle, styles.border1]}>
        <View style={{ flex: 1 }}>
          <FloatTextInput
            style={[styles.input, { flex: 1 }]}
            styleSuitName={'LoginScreen'}
            value={this.state.username}
            keyboardType="email-address"
            label={I18n.t('login_username')}
            onChangeText={(text) => this.setState({ username: text, errMsg: '', succMsg: '' })}
          />
        </View>
        {textElem}
      </View>
    );
  }
  render() {
    return (
      <LoginBg>
        {this.renderInputRow()}
        {this.renderErrMsg()}
        {this.renderBigBtn()}
        {this.renderBtnRow()}
      </LoginBg>
    );
  }
}

export default connect()(ForgotPWDScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    padding: 20,
  },
  icon: {
    fontSize: 27,
    color: themes.title_icon_color,
  },
  input: {
    fontSize: 16,
    lineHeight: 20,
  },
  border1: {
    // borderWidth: 1,
    // borderColor: 'black',
    // borderStyle: 'solid',
  },
  errMsgWrapper: {
    marginTop: 12,
    marginBottom: 12,
  },
  errMsgText: {
    fontSize: 14,
    color: '#EC2424',
    lineHeight: 20,
  },
});
