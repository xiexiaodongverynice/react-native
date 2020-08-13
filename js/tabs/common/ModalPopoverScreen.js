/**
 * Created by Guanghua on 01/17;
 * @flow
 */

import React, { Component } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  DeviceEventEmitter,
  ScrollView,
} from 'react-native';
import { Icon, ListItem, List, ActionSheet } from 'native-base';
import _ from 'lodash';
import HttpRequest from '../../services/httpRequest';
import CopySelect from '../template/CopySelect';
import I18n from '../../i18n';
import ModalPopoverIcon from '../common/components/ModalPopoverIcon';
import batchCreateCallPlanInCalender from '../customized/shgvp/batchCreateCallPlanInCalender';
// import CustomActionService from '../../services/customActionService';
// import { toastError } from '../../utils/toast';

type Prop = {
  navigation: any,
  addActions: ?Array<any>,
  onModalVisible: (visible: boolean) => void,
};

type State = {
  visible: boolean,

  anchorStyle: object,
};

class ModalPopoverScreen extends React.PureComponent<Prop, State> {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      anchorStyle: {},
    };

    this.container = null;
  }

  static defaultProps = {
    onModalVisible: () => void 0,
  };

  returnModalVisible = () => this.props.onModalVisible(this.state.visible);

  buttonItem = (visible: boolean, item: Object) => {
    const apiName = _.get(item, 'apiName');

    if (apiName === 'call_template') {
      this.templateHandler(item);
    } else {
      const targetLayoutRecordType =
        _.get(item, 'target_layout_record_type') || _.get(item, 'record_type');
      const { navigation } = this.props;
      this.setModalVisible(false);
      if (item.from && item.from == 'calender') {
        const actionStr = _.get(item, 'action');
        if (actionStr && actionStr == 'batch_create_call_plan') {
          // *绿谷日历批量创建拜访计划
          batchCreateCallPlanInCalender(this.props);
        } else {
          navigation.navigate('Create', {
            navParam: {
              refObjectApiName: item.object_describe_api_name,
              targetRecordType: targetLayoutRecordType,
              needReturn: true,
            },
            callback: _.get(item, 'completeActionCallback', () => {
              DeviceEventEmitter.emit('BackCalenderPageEvent');
            }),
          });
        }
      } else {
        navigation.navigate('Create', {
          navParam: {
            targetRecordType: targetLayoutRecordType,
            refObjectApiName: item.object_describe_api_name,
          },
          callback: _.get(item, 'completeActionCallback', () => {}),
        });
      }
    }
  };

  async templateHandler(item) {
    const { actionCode, token, objectDescription } = item;
    const { navigation } = this.props;
    if (actionCode == 'EDIT') {
      const id = item.data.id;
      const api = item.data.object_describe_name;
      const record_type = 'week';
      this.setModalVisible(false);
      navigation.navigate('Edit', {
        navParam: {
          objectApiName: api,
          id,
          record_type,
        },
        updateCallback: (updateData, ObejectApiName, callbackType) => {
          console.log(updateData, ObejectApiName, callbackType);
        },
      });
    } else if (actionCode == 'DELETE') {
      const id = item.data.id;
      const api = item.data.object_describe_name;
      this.setModalVisible(false);
      const result = await HttpRequest.deleteSingleRecord({ objectApiName: api, token, id });
      if (result.head) {
        if (result.head.code == 200) {
          //操作成功，刷新页面。
          navigation.goBack();
        }
      }
    } else if (actionCode == 'APPLY_TEMPLATE' || actionCode == 'COPY_TEMPLATE') {
      if (actionCode == 'COPY_TEMPLATE') {
        this.setModalVisible(false);
        navigation.navigate('CopySelect', {
          navParam: {
            record_type: 'day',
            item,
          },
        });
      } else {
        navigation.navigate('SelectList', {
          navParam: {
            record_type: 'day',
            item,
          },
        });
        this.setModalVisible(false);
      }
    }
  }

  buttonPress = (item: Object) => {
    const targetLayoutRecordType = _.get(item, 'target_layout_record_type');
    /**
     * detail page button
     */
    const { pressHandler } = item;
    if (_.isFunction(pressHandler)) {
      this.setModalVisible(false, () => {
        /**
         * 在真机环境下，由于性能比模拟器差，因此在modal还未完全隐藏或者刚要隐藏的同时，alert已经开始绘制并显示
         * 由于modal和alert共用的是同一个遮罩层，因此，在alert已经显示了的情况下，后续modal的隐藏操作将alert的图层销毁了，导致页面出现异常
         */
        setTimeout(pressHandler, 100);
      });
    } else {
      this.buttonItem(false, item);
    }
  };

  /**
   * TODO: Refactor
   * 对于公用组件以及公用页面，对外接口一定要保持明确。（可以采用 flow 的 Array<any> 甚至声明子组件）
   * 如出现像 addActions 这样的对象数组或者对象的 props。
   * 现在的问题是对于 ModalPopoverScreen，自己都不知道 addActions 中的对象会用到哪些属性。
   * 也无从考证，只能是利用数据去不断的使用默认值提升稳定性，对项目稳定性和数据规范没有实质上的帮助。
   * Regulation kills the bugs.
   */
  /**
   * Holy shit. 这里从列表页和详情页传递来的数据格式不一样, 本函数禁止继续维护。
   */

  unitActionData = (actionData) =>
    _.isObject(actionData.action)
      ? {
          actionCode: actionData.action.action,
          actionLabel: actionData.action.label,
          i18nKey: actionData.action['action.i18n_key'],
        }
      : {
          actionCode: actionData.action || actionData.actionCode,
          actionLabel: actionData.label || actionData.actionLabel,
          i18nKey: actionData['action.i18n_key'],
        };

  buttonListItem = () => {
    const { addActions } = this.props;

    return _.map(addActions, (item, index) => {
      const actionData = this.unitActionData(item);
      return (
        <View style={styles.listItem} key={`${item.label}`}>
          <TouchableOpacity style={[styles.button]} onPress={() => this.buttonPress(item)}>
            <ModalPopoverIcon
              icon={_.get(item, 'icon')}
              label={item.label}
              action={item.action}
              actionCode={item.actionCode}
            />
            <Text numberOfLines={2} style={{ fontSize: 12, paddingLeft: 5, color: '#333' }}>
              {I18n.t(_.get(actionData, 'i18nKey'), {
                defaultValue: actionData.actionLabel || actionData.actionCode || '',
              })}
            </Text>
          </TouchableOpacity>
        </View>
      );
    });
  };

  setModalVisible = (visible: boolean, callback: Function = () => void 0) => {
    this.setState(
      {
        visible,
      },
      callback,
    );
  };

  setAnchorPosition = async ({ pageX, pageY }, callback = () => void 0) => {
    const { anchorStyle } = this.state;

    if (this.container) {
      const styles = {};
      await new Promise((resolve) => {
        setTimeout(() => {
          if (!_.isFunction(_.get(this, 'container.measure'))) return;

          this.container.measure((x, y, width, height) => {
            /**
             * sometimes x y width height is all undefineds
             */
            if (Platform.OS === 'android') {
              width = this.container_width;
            }
            if (pageX !== null) {
              styles.right = width - pageX - 8;
            }
            if (pageY !== null) {
              styles.top = pageY - 8;
            }
            resolve(styles);
          });
        }, 100);
      });
      this.setState(
        {
          anchorStyle: Object.assign({}, anchorStyle, styles),
        },
        callback,
      );
    }
  };

  measureContainer = (event) => {
    if (Platform.OS === 'android') {
      this.container_width = event.nativeEvent.layout.width;
    }
  };

  render() {
    const { visible, anchorStyle } = this.state;
    let contentStyle = {};
    if (!_.isEmpty(anchorStyle)) {
      contentStyle = {
        top: anchorStyle.top + 18,
        right: anchorStyle.right - 10,
      };
    }

    return (
      <View ref={(el) => (this.container = el)} onLayout={this.measureContainer}>
        <Modal
          animationType="none"
          transparent
          visible={visible}
          onRequestClose={this.returnModalVisible}
          onDismiss={this.returnModalVisible}
          supportedOrientations={[
            'portrait',
            'portrait-upside-down',
            'landscape',
            'landscape-left',
            'landscape-right',
          ]}
          onOrientationChange={() => {}}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => {
              this.setModalVisible(false);
            }}
            activeOpacity={0}
          >
            <View style={{ backgroundColor: 'rgba(0,0,0,0.5)', flex: 1 }}>
              <Icon
                name="md-arrow-dropup"
                style={Object.assign({}, styles.triangleUp, anchorStyle)}
              />
              <ScrollView style={Object.assign({}, styles.sv, contentStyle, { maxHeight: 400 })}>
                <View style={styles.content}>{this.buttonListItem()}</View>
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  }
}

export default ModalPopoverScreen;

const styles = {
  triangleUp: {
    color: '#fff',
    fontSize: 30,
    position: 'absolute',
    right: 22,
    top: 40,
  },
  sv: {
    width: '36%',
    position: 'absolute',
    top: 58,
    right: 7,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 4,
    padding: 10,
  },
  listItem: {
    height: 50,
    padding: 0,
    justifyContent: 'center',
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderColor: '#eee',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingRight: 15,
    height: '100%',
    alignItems: 'center',
  },
};
