/**
 * 因为在安卓平台：
 *  ScrollView 直接嵌套可滚动组件如 webview，会导致 webview
 *  无法滑动。这里采用了禁用 scrollview 滑动，开启 webview 滑动，
 *  重写 ScrollView 的滑动事件来实现
 *
 * @flow
 */
import React from 'react';
import { ScrollView } from 'react-native';
import { STATUS_BAR_HEIGHT } from '../../components/statusBar/StatusBarWrapper';

const BOUNDARY_OFFSET = 80;
type Props = {
  children: any,
  wp: any,
};
export default class AndroidWebviewScrollView extends React.Component<Props> {
  lastY = 0;
  lastTo = 0;
  wvInfo = null;
  isWebViewTouched = false;
  scrollViewRef: { scrollTo: (Object) => null } = { scrollTo: () => null };

  /**
   * onLayout 测量是以 statusbar 以下为参考系的
   * touch 事件是以屏幕为参考系的
   */
  setIsWebViewTouched() {
    if (this.wvInfo) {
      const { pageY, height } = this.wvInfo;

      const wvPosition = pageY + STATUS_BAR_HEIGHT;
      this.isWebViewTouched =
        this.lastY > wvPosition + BOUNDARY_OFFSET &&
        this.lastY < wvPosition + height - BOUNDARY_OFFSET;
    }
  }

  onResponderGrantHandle = (event: Object) => {
    this.lastY = parseInt(event.nativeEvent.pageY);
    this.setIsWebViewTouched();
  };

  componentDidMount() {
    isAndroid && this.measureWV();
  }

  measureWV = () => {
    if (this.props.wp) {
      this.props.wp._children[0].measureInWindow((x, y, width, height) => {
        this.wvInfo = { height, pageY: y };
      });
    }
  };

  get canScroll() {
    return !this.isWebViewTouched;
  }

  /**
   * 已知:
   * 1. 当前所处坐标 currentY
   * 2. 上次滑动结束时的坐标 tmp
   * 3. scrollTo(目标位置)
   */
  onResponderMoveHandle = (event: Object) => {
    this.measureWV();

    if (this.canScroll) {
      const currentY = parseInt(event.nativeEvent.pageY);

      const distance = this.lastY - currentY;
      this.lastTo = this.lastTo + distance > 0 ? this.lastTo + distance : 0;

      this.scrollViewRef.scrollTo({ x: 0, y: this.lastTo, animated: true });
      this.lastY = currentY;
    }
  };

  render() {
    const { children, ...props } = this.props;
    const hanldeResponder = {
      onStartShouldSetResponder: (event) => true,
      onMoveShouldSetResponder: (event) => true,
      onResponderGrant: this.onResponderGrantHandle,
      onResponderMove: this.onResponderMoveHandle,
    };

    return (
      <ScrollView
        {...props}
        ref={(ref) => {
          this.scrollViewRef = ref;
        }}
        scrollEnabled={isIOS}
        {...(isIOS ? {} : hanldeResponder)}
      >
        {children}
      </ScrollView>
    );
  }
}
