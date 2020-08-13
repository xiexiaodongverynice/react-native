//@flow
/*eslint-disable*/

import React from 'react';
import { Button, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Modal, { ModalTitle, ModalContent, ModalFooter, ModalButton } from '../react-native-modals';
import { rnm_hideAlert } from './RNMWrapper';

type TypeProps = {
  onOkBtnPress: () => void,
  title: string,
  subTitle: string,
  moreText: string,
};

type TypeState = {};

const styles = {
  colorBlue: {
    color: 'blue',
  },
  colorGray: {
    color: '#999999',
  },
};

const top__filename = 'OutofRangeAlert';

export default class OutofRangeAlert extends React.Component<TypeProps, TypeState> {
  constructor(props) {
    super(props);
    this.state = { visible: true, moreClicked: false, showMore: true };
  }
  componentDidMount() {}

  componentWillUnmount() {}

  hide = () => {
    this.setState({ visible: false });
  };

  toggleMore = () => {
    this.setState({ showMore: !this.state.showMore });
  };

  renderMore() {
    if (this.state.showMore) {
      return <Text style={styles.colorGray}>{`\n${this.props.moreText}`}</Text>;
    }
  }

  handleOkButton = () => {
    this.hide();
    this.props.onOkBtnPress();
  };

  handleCancelButton = () => {
    this.hide();
  };
  //注意必须在onDismiss中执行 rnm_hideAlert，执行 rnm_hideAlert 的目的是让react释放这个元素
  //如果不执行 rnm_hideAlert，后续调用rnm_alert()可能会不展示。下面用示例说明：
  //example：
  //rnm_alert(elem0) 展示出来了，手动关掉
  //rnm_alert(elem0) 不会展示出来，因为此时state.visible=false
  //rnm_alert(elem1) 展示出来了，手动关掉，因为换元素了，react会重绘
  //rnm_alert(elem1) 不会展示出来，因为此时state.visible=false

  render() {
    const colorBlack = {color:'black'}
    return (
      <Modal
        width={0.8}
        visible={this.state.visible}
        rounded
        onTouchOutside={this.hide}
        onDismiss={rnm_hideAlert}
        modalTitle={<ModalTitle title={this.props.title} align="left" />}
        animationDuration={0}
        footer={
          <ModalFooter>
            <ModalButton text="取消" bordered onPress={this.handleCancelButton} key="button-1" />
            <ModalButton text="确定" bordered onPress={this.handleOkButton} key="button-2" />
          </ModalFooter>
        }
      >
        <ModalContent style={{ backgroundColor: '#fff' }}>
          <Text onPress={this.toggleMore} style={colorBlack}>
            {this.props.subTitle}
            {this.renderMore()}
          </Text>
        </ModalContent>
      </Modal>
    );
  }
}
