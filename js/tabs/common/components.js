/*
 Created by Uncle Charlie, 2017/12/20
 @flow
 */
import React from 'react';
import { Text, TextInput, View, Alert, InteractionManager, StyleSheet } from 'react-native';
import {
  Container,
  Separator,
  Badge,
  Header,
  ActionSheet,
  Button,
  Content,
  ListItem,
  Left,
  Right,
  Body,
  Icon,
  Input,
  Item,
} from 'native-base';
import _ from 'lodash';
import EditInput from '../../components/formComponents/EditInput';
import OptionView from './OptionView';
import themes from './theme';
import I18n from '../../i18n';
import AStorage from '../../utils/asStorage';
import { loadNavigationHistory, deleteNavigationHistory } from '../../actions/navigation';
import { TipIcon } from '../../components/formComponents/common';
import StatusBar, { BAR_STYLE } from '../../components/statusBar';
import StatusBarWrapper from '../../components/statusBar/StatusBarWrapper';
import theme from '../../utils/theme';
import VerticalSpacer from '../../components/common/VerticalSpacer';

let _confirmTip = true;

export function CustomView({
  type,
  disabled,
  content,
  id,
  onChange,
}: {
  type: string,
  disabled: boolean,
  content: any,
  id: string,
  onChange: (string) => void,
}) {
  return (
    <View key={`${type}_key-${id || ''}`} style={{ flexDirection: 'row' }}>
      <Text>{type}</Text>
      <Text>{content || ''}</Text>
      <Text>{disabled ? 'dis' : 'non-dis'}</Text>
    </View>
  );
}

export function StyledLeft({ children }: { children: any }) {
  return <Left style={{ flex: 2 }}>{children}</Left>;
}

/**
 * TextView with REQUIRED indicator
 */
export function RequiredTextView({
  disabled,
  isRequired,
  title,
  tipContent = '',
  pageType,
  handleTip = () => {},
  renderType,
}: {
  disabled: boolean,
  isRequired: boolean,
  title: string,
  tipContent: string,
  pageType: string,
  handleTip: void,
  renderType: string,
}) {
  return (
    <View
      style={{
        alignItems: 'stretch',
        justifyContent: 'flex-start',
        alignSelf: 'stretch',
        flexDirection: 'row',
        flex: 1,
        marginTop: renderType === 'long_text' ? 10 : 0,
      }}
    >
      <Text
        style={[
          {
            textAlignVertical: 'center',
            fontSize: 14,
          },
          pageType !== 'detail'
            ? { color: disabled ? themes.input_disable_color : themes.input_color }
            : {},
        ]}
      >
        {title}
      </Text>
      {isRequired ? (
        <Text style={{ color: 'red', marginLeft: 3, textAlignVertical: 'center' }}>*</Text>
      ) : (
        <View style={{ width: 10 }} />
      )}
      {tipContent ? <TipIcon style={{ alignSelf: 'flex-start' }} onPress={handleTip} /> : null}
    </View>
  );
}

type Prop = {
  navigation: any,
  type: string,
  disabled: boolean,
  content: any,
  id: string,
  onChange: (string) => void,
};

type State = {
  zoneVisible: boolean,
};

export class PhoneInput extends React.PureComponent<Prop, State> {
  state: State = {
    zoneVisible: false,
  };

  _handlePress = () => {
    this.setState({
      zoneVisible: !this.state.zoneVisible,
    });
  };

  render() {
    const { navigation, type, disabled, content, id, onChange } = this.props;
    return (
      <View key={id || ''} style={{ flexDirection: 'row' }}>
        <OptionView userValue={content} />
        <EditInput disabled={disabled} content={content} onChangeText={onChange} />
      </View>
    );
  }
}

export function ListDivider() {
  return (
    <View
      style={{
        flex: 1,
        width: '100%',
        height: themes.regular_border_width,
        backgroundColor: themes.border_color_base,
      }}
    />
  );
}

export function StyledBadge(props: any) {
  const { badgeStyles, text } = props;
  const defaultBadge = { alignItems: 'center', justifyContent: 'center' };
  const defaultText = {
    fontSize: theme.badgeTextSize,
    fontWeight: 'bold',
    color: 'white',
    // marginTop: 5,
  };

  return (
    <Badge {...props} style={[defaultBadge, badgeStyles && badgeStyles.badge]}>
      <Text style={[defaultText, badgeStyles && badgeStyles.badgeText]}>{text || ''}</Text>
    </Badge>
  );
}

export function StyledSeparator(props: any) {
  return <Separator {...props}>{props.children}</Separator>;
}

export function DetailScreenSectionHeader(props: { text: string, rightNumText?: string }) {
  const outerViewStyle = {
    backgroundColor: 'white',
    height: 50,
    paddingLeft: 10,
    paddingRight: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  };
  const textStyle = {
    fontSize: 18,
    color: '#333333',
    fontWeight: 'bold',
  };
  const lineStyle = {
    backgroundColor: '#EEEEEE',
    height: 1,
    position: 'absolute',
    bottom: 0,
    left: 10,
    right: 10,
  };
  const rightNumTextStyle = {
    fontSize: 12,
    color: '#666666',
  };
  const rightTextElem = props.rightNumText ? (
    <View>
      <VerticalSpacer height={4} />
      <Text style={rightNumTextStyle}>{props.rightNumText}</Text>
    </View>
  ) : null;
  return (
    <View style={outerViewStyle}>
      <Text style={textStyle}>{props.text}</Text>
      {rightTextElem}
      <View style={lineStyle} />
    </View>
  );
}

export function StyledContainer(props: any) {
  const baseStyle = {
    backgroundColor: themes.fill_base,
    position: 'relative',
  };
  let style = baseStyle;
  if (themes.isIphoneX) {
    style = Object.assign({}, baseStyle, {
      paddingBottom: 34,
    });
  }
  return <Container style={style}>{props.children}</Container>;
}

//StyledContainer不支持覆盖style，所以只能创建一个新的class。区别就是背景色为f9f9f9
export function StyledContainerIndexScreen(props: any) {
  const baseStyle = {
    backgroundColor: '#f9f9f9',
    position: 'relative',
  };
  let style = baseStyle;
  if (themes.isIphoneX) {
    style = Object.assign({}, baseStyle, {
      paddingBottom: 34,
    });
  }
  return <Container style={style}>{props.children}</Container>;
}

export function StyledHeader({ children, style = {}, ...props }: { style: Object, children: any }) {
  const composedStyle = {
    backgroundColor: theme.headerBackground,
    height: NAV_BAR_HEIGHT,
    paddingTop: 0,
    elevation: 0,
    ...style,
  };

  return (
    <StatusBarWrapper barTintColor={composedStyle.backgroundColor}>
      <Header style={composedStyle} {...props}>
        {children}
      </Header>
    </StatusBarWrapper>
  );
}

// width is flex width
export function StyledBody({
  style,
  flexWidth,
  children,
  bodyStyle = {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
}: {
  style: ?any,
  flexWidth: ?number,
  children: ?any,
  bodyStyle: ?any,
}) {
  const widthStyle = flexWidth ? { flex: flexWidth } : { flex: 5, zIndex: -1 };
  const theStyle = bodyStyle ? _.assign({}, widthStyle, bodyStyle, style) : widthStyle;
  return <Body style={theStyle}>{children}</Body>;
}
/**
 * screen页面专用
 * 普通回退操作切勿使用此组件
 */
export function HeaderLeft({
  navigation,
  dispatch,
  screen,
  needConfirm,
}: {
  dispatch: void,
  navigation: any,
  screen: any,
  needConfirm: boolean,
}) {
  return (
    <Left style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
      <Button
        transparent
        onPress={() => {
          if (dispatch) {
            const key = _.get(screen, 'navigation.state.key');
            dispatch(
              loadNavigationHistory((screenInfos) => {
                /**
                 * 刷新screen页面，如果screen页面为多个标签页，那么这个操作就是刷新第一个userinfodetail
                 */
                const currentIndex = _.findLastIndex(screenInfos, {
                  key,
                });

                const preScreenInfo = screenInfos[currentIndex - 1];
                const onRefresh = _.get(preScreenInfo, 'onRefresh');
                if (_.isFunction(onRefresh)) {
                  onRefresh();
                }

                const pageType = _.get(preScreenInfo, 'pageType');
                if (pageType && pageType === 'index') {
                  // AStorage.delete('CalenderFakeData');
                  // AStorage.delete('RelatedCalenderChangeList');
                  // AStorage.save('CalenderFakeDataDeleteList', []);
                }
                /**
                 * 刷新所有标签页数据
                 */
                const tabs = _.get(preScreenInfo, 'tabs');
                if (tabs && !_.isEmpty(tabs)) {
                  tabs.forEach((tab) => {
                    const tabRefresh = tab.onRefresh;
                    if (_.isFunction(tabRefresh)) {
                      tabRefresh();
                    }
                  });
                }

                dispatch(deleteNavigationHistory(key));
              }),
            );
          }

          if (needConfirm) {
            if (!_confirmTip) return;
            _confirmTip = false;
            CustomerConfirm({
              title: I18n.t('components.ConfirmToDiscardChanged'),
              onOKObj: {
                handle: () => {
                  _confirmTip = true;
                  navigation.goBack();
                },
              },
              onCancelObj: {
                handle: () => {
                  _confirmTip = true;
                },
              },
            });
          } else {
            navigation.goBack();
          }
        }}
      >
        <Icon
          name="ios-arrow-back"
          style={{
            color: themes.title_icon_color,
            fontSize: themes.font_header_size,
          }}
        />
      </Button>
    </Left>
  );
}

export function HeaderRight({ children }: { children: ?any }) {
  return <Right style={{ flex: 1 }}>{children}</Right>;
}

export function Confirm({
  title = '',
  message,
  onCancel,
  onOK,
}: {
  title: string,
  message?: string,
  onCancel?: () => void,
  onOK: () => void,
}) {
  /**
   * @see https://github.com/facebook/react-native/issues/10471
   */
  InteractionManager.runAfterInteractions(() => {
    setTimeout(() => {
      Alert.alert(
        title,
        message,
        [
          {
            text: I18n.t('common_cancel'),
            onPress: onCancel || (() => {}),
          },
          {
            text: I18n.t('common_sure'),
            onPress:
              onOK ||
              (() => {
                console.log('ok');
              }),
          },
        ],
        { cancelable: false },
      );
    }, 100);
  });
}

/**
 * * 该组件不要用在modal出现之后，在modal消失后马上调用Alert，有时候会无法弹出，只能重启应用
 * TODO 后续扩展参数，区分是否有用在modal后的场景
 * @param {*} param0
 */
export function CustomerConfirm({
  title = '',
  message,
  onCancelObj,
  onOKObj,
}: {
  title: string,
  message: string,
  onCancelObj: {
    tip: string,
    handle: void,
  },
  onOKObj: {
    tip: string,
    handle: string,
  },
}) {
  const handles = [];
  let onCancelHandle, onCancelTip, onOKHandle, onOKTip;

  if (!_.isEmpty(onCancelObj)) {
    onCancelHandle = _.get(onCancelObj, 'handle');
    onCancelTip = _.get(onCancelObj, 'tip');
  }

  if (!_.isEmpty(onOKObj)) {
    onOKHandle = _.get(onOKObj, 'handle');
    onOKTip = _.get(onOKObj, 'tip');
  }

  if (onCancelHandle && _.isFunction(onCancelHandle)) {
    handles.push({
      text: onCancelTip || I18n.t('common_cancel'),
      onPress: onCancelHandle || (() => {}),
    });
  }

  if (onOKHandle && _.isFunction(onOKHandle)) {
    handles.push({
      text: onOKTip || I18n.t('common_sure'),
      onPress: onOKHandle || (() => {}),
    });
  }

  /**
   * @see https://github.com/facebook/react-native/issues/10471
   */
  InteractionManager.runAfterInteractions(() => {
    // setTimeout(() => {
    Alert.alert(title, message, handles, { cancelable: false });
    // }, 100);
  });
}

export function ButtonListContainer({ children }: { children: any }) {
  const baseStyle = {
    position: 'absolute',
    height: 50,
    flex: 1,
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  };
  let style = baseStyle;
  if (themes.isIphoneX) {
    style = Object.assign({}, baseStyle, {
      bottom: 20,
    });
  }
  return <View style={style}>{children}</View>;
}
