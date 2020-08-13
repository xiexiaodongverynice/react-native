/**
 * Create by yjgao
 * @flow
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Title, Icon, Left, Body, Right, Button, Content } from 'native-base';
import _ from 'lodash';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { StyledContainer, StyledHeader } from '../common/components';
import themes from '../common/theme';
import {
  cascadeUpdateData,
  cascadeDeleteAllData,
  cascadeUpdateStatus,
  cascadeDeleteData,
} from '../../actions/cascadeAction';
import * as Util from '../../utils/util';
import { toastError, toastWaring } from '../../utils/toast';
import { checktIsFillout } from '../../tabs/customized/jmkx/validPreProduct';
import handleUpdateCascade, {
  CASCADE_CREATE,
  CASCADE_DELETE,
  CASCADE_UPDATE,
} from '../../utils/helpers/handleUpdateCascade';
import ModalWrapper from '../../components/modal/ModalWrapper';
import ModalLoadingScreen from '../../components/modal/ModalLoadingScreen';
import CustomActionService from '../../services/customActionService';
import IndexSwiperRecord from '../common/components/indexComponents/IndexSwiperRecord';
import { checkExpression } from '../common/helpers/recordHelper';

type Props = {
  navigation: any,
  cascadeData: any,
  actions: any,
  dispatch: void,
  onComponentDidMount: any,
  onComponentUnMount: any,
  objectDescription: any,
};

class RelatedScreen extends React.PureComponent<Props, States> {
  constructor(props) {
    super(props);
    const params = _.get(props, 'navigation.state.params');
    this.parentApiName = _.get(params, 'parentApiName');
    this.objectApiName = _.get(params, 'objectApiName');
    this.parentData = _.get(params, 'parentData');
    this.pageType = _.get(params, 'pageType');
    this.pageTypeLevel = _.get(params, 'pageTypeLevel');
    this.relateComponent = _.get(params, 'relateComponent', {});
    this.relatedListName = _.get(this.relateComponent, 'related_list_name');
    this.rowActions = _.get(this.relateComponent, 'row_actions', []);

    // * 判断产品预加载
    this.product_setting = _.get(this.relateComponent, 'product_setting', {});

    this.component = _.get(params, 'component', {});

    this.updateRelatedIndex = _.get(params, 'updateRelatedIndex', () => {});

    //* modal打开和关闭
    this.handleHide = _.noop;
    this.handleShow = _.noop;
  }

  componentDidMount() {
    const { onComponentDidMount } = this.props;
    if (_.isFunction(onComponentDidMount)) {
      onComponentDidMount(this.refresh);
    }
  }

  componentWillUnmount() {
    const { onComponentUnMount } = this.props;
    if (_.isFunction(onComponentUnMount)) {
      onComponentUnMount();
    }
  }

  updateAction = (data) => {
    const { navigation } = this.props;

    let params = {
      objectApiName: this.objectApiName,
      ...data,
    };

    if (this.pageType === 'edit' || this.pageType === 'add') {
      params = _.assign({}, params, {
        parentData: this.parentData,
        _parentId: _.get(this.parentData, 'id'),
        related_list_name: this.relatedListName,
      });
      navigation.navigate('EditModal', { navParam: params });
    }
  };

  /**
   * ! 启动product_setting 预加载功能后才能调用此 方法
   * * 根据cascadeData 的 _status 获取未修改的库存数据
   * * 将未修改的cascade 数据的productId传给customer action，获取上次提交成功的库存数据
   * * 调用customer action 获取上次保存具体数据来填充未修改库存数据
   * * 通过 handleUpdateCascade update 更新cascadeData
   *
   * @memberof RelatedScreen
   */
  fillPrevRelated = async (actionLayout) => {
    const customerId = _.get(this.parentData, 'customer');
    if (!customerId) {
      toastWaring('请先选择客户');
      return;
    }

    this.handleShow();
    const { cascadeData, dispatch } = this.props;

    const noModifiedProductIds = _.values(cascadeData)
      .filter((item) => !_.has(item, '_status') && _.get(item, 'product'))
      .map((item) => _.get(item, 'product'));

    const payload = {
      objectApiName: 'inventory',
      action: _.get(actionLayout, 'action'),
      ids: [],
      params: {
        customerId,
        product: noModifiedProductIds,
      },
      token: global.FC_CRM_TOKEN,
    };
    const { body: waitFillDatas } = await CustomActionService.executeAction(payload);

    const resultFillDatas = _.map(noModifiedProductIds, (productId) => {
      const waitFillData = _.get(waitFillDatas, productId, {});
      const prevLoadData = _.find(cascadeData, { product: productId });
      return { ...prevLoadData, ...waitFillData };
    });

    handleUpdateCascade({
      data: resultFillDatas,
      status: CASCADE_UPDATE,
      relatedListName: this.relatedListName,
      parentId: _.get(this.parentData, 'id'),
      dispatch,
    });

    this.handleHide();
  };

  //* 滑动action 操作
  swipeAction = (action, data) => {
    const { dispatch } = this.props;
    const actionType = _.toUpper(_.get(action, 'action'));

    if (actionType === 'DELETE') {
      handleUpdateCascade({
        data,
        relatedListName: this.relatedListName,
        status: CASCADE_DELETE,
        parentId: _.get(this.parentData, 'id'),
        dispatch,
      });
    } else if (actionType === 'EDIT') {
      this.updateAction(data);
    } else if (actionType === 'WIPE') {
      if (checktIsFillout(data)) return;

      handleUpdateCascade({
        data,
        relatedListName: this.relatedListName,
        status: CASCADE_DELETE,
        parentId: _.get(this.parentData, 'id'),
        dispatch,
      });

      handleUpdateCascade({
        data: { product: _.get(data, 'product'), product__r: _.get(data, 'product__r') },
        relatedListName: this.relatedListName,
        status: CASCADE_CREATE,
        parentId: _.get(this.parentData, 'id'),
        dispatch,
      });
    }
  };

  createAction = (action) => {
    const { navigation } = this.props;
    const actionCode = _.get(action, 'action');
    const recordType = _.get(action, 'target_layout_record_type', 'master');
    const relatedListName = _.get(action, 'related_list_name');

    const navParam = {
      refObjectApiName: this.objectApiName,
      targetRecordType: recordType,
      parentData: this.parentData,
      relatedListName,
      initData: {},
    };

    _.set(navParam, `initData.${this.parentApiName}__r`, this.parentData);

    if (actionCode === 'relatedADD') {
      navigation.navigate('CreateModal', { navParam });
    } else if (_.get(action, 'is_custom', false)) {
      this.fillPrevRelated(action);
    }
  };

  renderButtomButon = () => {
    const actions = _.get(this.relateComponent, 'actions', []);
    const buttomActions = [];
    if (this.pageType !== 'detail') {
      _.each(actions, (action) => {
        //* 配置预填充时去除手动添加按钮
        if (!_.isEmpty(this.product_setting) && _.get(action, 'action') == 'relatedADD') return;

        const disabled_expression = _.get(action, 'disabled_expression', 'return false');
        const isDisabled = Util.executeDetailExp(disabled_expression, {}, this.parentData);
        action['is_disabled'] = isDisabled;
        const hidden_expression = _.get(action, 'hidden_expression', 'return false');
        const isHidden = Util.executeDetailExp(hidden_expression, {}, this.parentData);
        if (!isHidden && action.action) {
          buttomActions.push(action);
        }
      });
    }

    return (
      <View>
        {buttomActions &&
          _.map(buttomActions, (action, index) => {
            const is_disabled = _.get(action, 'is_disabled', false);
            return (
              <TouchableOpacity
                key={'action_' + index}
                onPress={() => {
                  if (is_disabled) return;
                  this.createAction(action);
                }}
              >
                <View style={styles.buttonStyle}>
                  <Icon name="ios-add-circle-outline" style={styles.icon} />
                  <Text
                    style={{
                      color: is_disabled ? '#c9c9c9' : themes.title_background,
                      fontSize: themes.title_size,
                    }}
                  >
                    {action.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
      </View>
    );
  };

  navagateDetail = (item) => {
    const { navigation } = this.props;

    const commomDetail = _.find(this.rowActions, (action) => _.get(action, 'action') === 'DETAIL');
    const relatedDetail = _.find(
      this.rowActions,
      (action) => _.get(action, 'action') === 'RELATEDDETAIL',
    );

    const actionDetail =
      (!_.isEmpty(commomDetail) && commomDetail) || (!_.isEmpty(relatedDetail) && relatedDetail);

    if (!actionDetail) return;

    const disabled_expression = _.get(actionDetail, 'disabled_expression', 'return false');
    const is_disable = checkExpression(disabled_expression, item, this.parentData);
    if (is_disable) return;

    let params = { objectApiName: this.objectApiName, ...item };

    if (actionDetail.action === 'RELATEDDETAIL') {
      const relatedDetailParams = this.getRelatedDetailParams(actionDetail, item);
      params = { ...params, ...relatedDetailParams };
    }

    if (this.pageType === 'edit' || this.pageType === 'add') {
      if (_.isEmpty(this.product_setting)) {
        navigation.navigate('DetailModal', {
          navParam: {
            ...params,
            parentData: this.parentData,
            _parentId: _.get(this.parentData, 'id'),
            related_list_name: this.relatedListName,
          },
        });
      } else {
        // * 预加载在编辑状态下点击item直接进入edit状态
        navigation.navigate('EditModal', {
          navParam: {
            ...params,
            parentData: this.parentData,
            _parentId: _.get(this.parentData, 'id'),
            related_list_name: this.relatedListName,
          },
        });
      }
    } else if (this.pageType === 'detail' && this.pageTypeLevel === 'main') {
      //* 从top层详情也进入下层详情页，只有top层详情页会清楚reducer级联数据

      navigation.navigate('Detail', {
        navParam: { ...params, parentData: this.parentData, isTopLevel: false },
      });
    }
  };

  renderItem = (item, index, padlayout) => {
    if (_.isEmpty(item)) return null;

    const key = `indexrecord-${Math.random()}-${this.objectApiName}`;

    return (
      <View
        key={key}
        style={{
          borderBottomColor: '#c9c9c9',
          borderBottomWidth: themes.borderWidth,
          flex: 1,
        }}
      >
        <IndexSwiperRecord
          index={index}
          padlayout={padlayout}
          data={item}
          pageType={this.pageType}
          objectApiName={this.objectApiName}
          rowActions={this.pageType === 'detail' ? [] : this.rowActions}
          parentData={this.parentData}
          swipeAction={this.swipeAction}
          component={this.relateComponent}
          onPress={() => {
            this.navagateDetail(item);
          }}
        />
      </View>
    );
  };

  renderComponent = () => {
    const { cascadeData } = this.props;

    const padlayout = _.get(this.relateComponent, 'padlayout');
    const header = _.get(this.relateComponent, 'header', '列表');

    if (_.isEmpty(cascadeData)) return null;
    if (!padlayout) {
      toastError(`${header}需配置padlayout`);
      return;
    }

    let cascadeDataList = _.values(cascadeData);
    //* 根据prodctID 排序
    if (cascadeDataList.length > 1) {
      cascadeDataList = cascadeDataList.sort((a, b) => {
        const productAID = _.get(a, 'product');
        const productBID = _.get(b, 'product');
        if (productAID && productBID && productAID > productBID) {
          return -1;
        } else {
          return 1;
        }
      });
    }

    return _.map(cascadeDataList, (item, index) => this.renderItem(item, index, padlayout));
  };

  render() {
    const { navigation } = this.props;

    const header = _.get(this.relateComponent, 'header', '列表');
    return (
      <StyledContainer style={{ backgroundColor: themes.fill_base }}>
        <StyledHeader>
          <Left style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <Button
              transparent
              onPress={() => {
                navigation.goBack();
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
          <Body style={{ flex: 1, alignItems: 'center' }}>
            <Title
              style={{
                color: themes.title_text_color,
                fontSize: themes.title_size,
              }}
            >
              {header}
            </Title>
          </Body>
          <Right style={{ flex: 1 }} />
        </StyledHeader>
        <Content>
          {this.renderComponent()}
          <View>{this.renderButtomButon()}</View>
          <ModalWrapper>
            {({ visible, show, hide }) => {
              this.handleShow = show;
              this.handleHide = hide;
              return <ModalLoadingScreen visibleStatus={visible} />;
            }}
          </ModalWrapper>
        </Content>
      </StyledContainer>
    );
  }
}

const select = (state, screen) => {
  const relatedListName = _.get(
    screen,
    'navigation.state.params.relateComponent.related_list_name',
  );
  const cascadeData = _.get(state, `cascade.cascadeList.${relatedListName}`, {});

  return {
    objectDescription: state.settings.objectDescription,
    cascadeData: _.cloneDeep(cascadeData),
  };
};

const act = (dispatch, props) => ({
  actions: bindActionCreators(
    { cascadeUpdateData, cascadeDeleteAllData, cascadeUpdateStatus, cascadeDeleteData },
    dispatch,
  ),
  dispatch,
});

export default connect(select, act)(RelatedScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#F5F5F9',
    height: 800,
  },
  itemStyle: {
    flex: 1,
    flexDirection: 'row',
    height: 80,
    backgroundColor: 'white',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingLeft: 10,
  },
  itemLeft: {
    flexDirection: 'column',
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    color: themes.title_background,
    fontSize: themes.icon_size_md,
    marginRight: 10,
    fontWeight: 'bold',
  },
  buttonStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginTop: 10,
    padding: 10,
  },
});
