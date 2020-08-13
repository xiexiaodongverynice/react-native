/**
 * @flow
 *Created by Guanghua on 11/14;
 */
import React from 'react';
import { Text, StyleSheet, Platform } from 'react-native';
import { Button, Container, Form, Item, Label, Body, Header, Right, Title } from 'native-base';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import _ from 'lodash';
import Input from '../../lib/Input';
import I18n from '../../i18n/index';
import * as userActions from '../../actions/login';
import Constants from '../common/Constants';
import { HeaderLeft, StyledHeader } from '../common/components';
import themes from '../common/theme';
import { toastWaring } from '../../utils/toast';

type Props = {
  navigation: Object,
  dispatch: Function,
};
class ChangePasswordScreen extends React.Component<Props> {
  constructor(props) {
    super(props);
    this.oldPassword = '';
    this.newPassword = '';
    this.reEnterPassword = '';
    this._tabsNavAction = Constants.tabsNavAction;
  }

  changePassword = () => {
    const token = _.get(this.props, 'token');
    const loginAccount = _.get(this.props, 'userInfo.account');
    if (!this.oldPassword) {
      toastWaring(I18n.t('enter_old_password'));
      return;
    }
    if (this.newPassword !== this.reEnterPassword) {
      toastWaring(I18n.t('differ_password'));
      return;
    }
    if (!this.newPassword) {
      toastWaring(I18n.t('enter_password'));
      return;
    }
    const payload = {
      head: { token },
      body: {
        loginId: loginAccount,
        oldPwd: this.oldPassword,
        newPwd: this.newPassword,
        deviceType: Platform.OS === 'ios' ? 'iOS' : 'Android',
      },
    };
    this.props.dispatch(userActions.changePassWordAction(payload));
  };

  render() {
    return (
      <Container>
        <StyledHeader
          style={{
            backgroundColor: themes.title_background,
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <HeaderLeft style={{ flex: 1 }} navigation={this.props.navigation} />
          <Body
            style={{
              alignItems: 'center',
              flex: 1,
            }}
          >
            <Title
              style={{
                color: themes.title_text_color,
                fontWeight: '600',
                fontSize: 17,
                textAlign: 'center',
              }}
            >
              {I18n.t('change_password')}
            </Title>
          </Body>
          <Right />
        </StyledHeader>
        <Form style={{ marginTop: 15 }}>
          <Item inlineLabel style={[styles.item, { marginBottom: 15 }]}>
            <Label style={styles.label}>{I18n.t('old_password')}</Label>
            <Input
              style={styles.input}
              autoFocus
              secureTextEntry
              onChangeText={(text) => (this.oldPassword = text)}
            />
          </Item>
          <Item inlineLabel style={styles.item}>
            <Label style={styles.label}>{I18n.t('new_password')}</Label>
            <Input
              style={styles.input}
              secureTextEntry
              onChangeText={(text) => (this.newPassword = text)}
            />
          </Item>
          <Item inlineLabel style={styles.item}>
            <Label style={styles.label}>{I18n.t('re_enter_password')}</Label>
            <Input
              style={styles.input}
              secureTextEntry
              onChangeText={(text) => (this.reEnterPassword = text)}
            />
          </Item>
          <Button
            block
            style={{
              marginTop: 20,
              backgroundColor: '#4990EC',
              marginHorizontal: 20,
            }}
            onPress={() => {
              this.changePassword();
            }}
          >
            <Text
              style={{
                color: '#fff',
                fontSize: themes.button_font_size,
              }}
            >
              {I18n.t('change_password_button')}
            </Text>
          </Button>
        </Form>
      </Container>
    );
  }
}

const select = (state) => ({
  token: state.settings.token,
  userInfo: state.settings.userInfo,
});

const ChangePasswordAction = userActions.changePassWordAction;
const LogoutAction = userActions.logoutAction;
const act = (dispatch) => ({
  actions: bindActionCreators({ ChangePasswordAction, LogoutAction }, dispatch),
  dispatch,
});

export default connect(select, act)(ChangePasswordScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    padding: 20,
  },
  item: {
    backgroundColor: '#fff',
    marginLeft: 0,
  },
  label: {
    marginLeft: 20,
  },
  input: {
    marginRight: themes.h_spacing,
    textAlign: 'right',
  },
});
