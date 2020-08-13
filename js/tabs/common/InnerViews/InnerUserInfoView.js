/**
 * Create by Uncle Charlie, 3/1/2018
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { Container, Content, ListItem, StyleProvider } from 'native-base';
import _ from 'lodash';
import { Text, View, DeviceEventEmitter } from 'react-native';
import Privilege from 'fc-common-lib/privilege';
import { DetailScreenSectionHeader, ButtonListContainer } from '../components';
import IndexDataParser from '../../../services/dataParser';
import LoadingScreen from '../LoadingScreen';
import ErrorScreen from '../ErrorScreen';
import themes from '../theme';
import I18n from '../../../i18n';
import * as Util from '../../../utils/util';
import MediaView from '../MediaView';
import DetailFormItem from '../DetailFormItem';
import { checkSectionShowable } from '../helpers/recordHelper';
import BarViewItem from '../BarViewItem';
import RelatedItem from '../../../components/formComponents/RelateItem';
import ApprovalFlowSection from '../../../components/approval/ApprovalFlowSection';
import { DETAIL_EXTENSION_CONFIGS } from '../../../components/extender';
import { isExistModalView } from './isExistModalView';
import WorkFlowHeaderSection from '../../../components/workFlow/WorkFlowHeaderSection';
import { BUSEVENT_NEED_REFRESH_DETAIL } from '../../../actions/event';
import SpinnerHeader from '../../../components/hintView/SpinnerHeader';
import { BUSEVENT_QUERY_UPDATE_DATA_SUCCESS } from '../../../../js/actions/query';
import assert from '../../../utils/assert0';
import VerticalSpacer from '../../../components/common/VerticalSpacer';
import detailScreen_styles from '../../../styles/detailScreen_styles';
import { getDetailScreenViewingNativeBaseTheme } from '../../../styles/nativebaseTunedStyles';

const top__filename = 'InnerUserInfoView.js';

const ACTION_DETAIL = 'detail';

type Prop = {
  token: string,
  navigation: any,
  objectDescription: any,
  profile: any,
  detailData: any,
  dataLoading: boolean,
  dataError: boolean,
  param: any,
  apiName: string,
  layout: any,
  pageType: string,
  pageTypeLevel: 'main' | 'sub',
  navigation: any,
  objectDescribeApiName: string,
  renderButtonList: (component: any) => void,
  permission: any,
  detailLayout: any,
  fromRecordType?: string,
  handleSectionData: void,
  components: any,
  callExtenderRefresh: boolean,
  approvalFlowInfo: any, //* 审批流信息
  isTopLevel: boolean,
  recordData: any,
  refreshData: (startHook, afterHook) => {}, //刷新页面，仅data、不刷新layout
};

type State = {
  isRefreshing: boolean,
};

//InnerUserInfoView仅用于查看，不用于编辑！
class InnerUserInfoView extends React.Component<Prop, State> {
  //添加或删除 参与人 后，刷新详情页面
  //具体的刷新方法是 this.props.refreshData
  onBUSEVENT_NEED_REFRESH_DETAIL(eventId: any) {
    const page_eventId = _.get(this.props.navigation, 'state.params.navParam.id');
    assert(page_eventId);

    global.tron.log(
      `onBUSEVENT_NEED_REFRESH_DETAIL eventId=${eventId} page_eventId=${page_eventId}`,
    );

    //正在刷新，就不要再次刷新了
    if (this.state.isRefreshing) {
      return;
    }

    if (page_eventId && eventId === page_eventId) {
      this.setState({ isRefreshing: true });
      global.tron.log('onBUSEVENT_NEED_REFRESH_DETAIL will refreshData');

      const startHook = () => {};
      const afterHook = () => {
        this.setState({ isRefreshing: false });
      };
      this.props.refreshData(startHook, afterHook);
    }
  }

  //添加临时参会人后，刷新详情页面。没有用到data参数
  onBUSEVENT_QUERY_UPDATE_DATA_SUCCESS({ action, data }) {
    const eventId = _.get(action, 'payload.state.updateData.event'); //取不到就是undefined
    this.onBUSEVENT_NEED_REFRESH_DETAIL(eventId);
  }

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount(): void {
    this.busListener0 = (eventId) => this.onBUSEVENT_NEED_REFRESH_DETAIL(eventId);
    this.busListener1 = ({ action, data }) =>
      this.onBUSEVENT_QUERY_UPDATE_DATA_SUCCESS({ action, data });
    DeviceEventEmitter.addListener(BUSEVENT_NEED_REFRESH_DETAIL, this.busListener0);
    DeviceEventEmitter.addListener(BUSEVENT_QUERY_UPDATE_DATA_SUCCESS, this.busListener1);
  }

  componentWillUnmount(): void {
    DeviceEventEmitter.removeListener(BUSEVENT_NEED_REFRESH_DETAIL, this.busListener0);
    DeviceEventEmitter.removeListener(BUSEVENT_QUERY_UPDATE_DATA_SUCCESS, this.busListener1);
  }
  renderMediaView = () => {
    const mediaView = this.renderMediaView_concrete();
    if (mediaView) {
      return (
        <React.Fragment>
          {mediaView}
          <VerticalSpacer height={10} />
        </React.Fragment>
      );
    } else {
      return null;
    }
  };
  renderMediaView_concrete = () => {
    const { navigation, objectDescribeApiName, detailData } = this.props;

    if (objectDescribeApiName !== 'clm_presentation') {
      return null;
    }

    const url = _.get(detailData, 'url');

    return <MediaView url={url} navigation={navigation} id={_.get(detailData, 'id')} />;
  };

  composeBasicInfo_section = (section: any, basicInfo: any): Array => {
    const {
      apiName,
      objectDescribeApiName,
      objectDescription,
      token,
      permission,
      navigation,
      detailData,
      components,
      detailLayout,
      callExtenderRefresh,
      handleSectionData = () => {},
      pageTypeLevel,
      isTopLevel,
    } = this.props;
    const fieldsElements = [];
    const currentDescription = IndexDataParser.getObjectDescByApiName(
      objectDescribeApiName || apiName,
      objectDescription,
    );

    if (!checkSectionShowable(section, 'phone', 'detail')) {
      return;
    }

    const hideSection =
      _.indexOf(_.get(section, 'hidden_when'), 'detail') >= 0 ||
      Util.executeExpression(_.get(section, 'hidden_expression', 'return false'), {});

    if (hideSection) {
      console.warn(
        `===> Detail screen, user has no right to access this section - ${section.header}  `,
      );
      return;
    }

    const sectionFields = _.get(section, 'fields');
    const isExtender = _.get(section, 'is_extender', false);
    const headerText = I18n.t(_.get(section, ['header.i18n_key']), {
      defaultValue: section.header || '',
    });
    section.header &&
      fieldsElements.push(
        <DetailScreenSectionHeader key={fieldsElements.length + 1 + 'header'} text={headerText} />,
      );

    if (isExtender) {
      const formItemExtender = _.get(section, 'form_item_extender');

      const basicProps = {
        parentRecord: _.get(this.props, 'detailData'),
        token,
        header: section.header,
        navigation,
        objectDescription: this.props.objectDescription,
        pageType: 'detail',
        pageTypeLevel,
        parentApiName: apiName,
        field_section: section,
      };

      const extensionConfig = _.get(DETAIL_EXTENSION_CONFIGS, formItemExtender, {});

      if (!_.isEmpty(extensionConfig) && _.get(extensionConfig, 'component', null)) {
        //* 获取扩展组件和扩展所需的props
        const ExtensionComponent = extensionConfig.component;
        const extensionalPropsFields = _.get(extensionConfig, 'extensionalPropsFields', []);

        const extensionalProps = {};
        const extensionalPropsData = _.assign({}, this.props, {
          components: _.get(detailLayout, 'containers[0].components', {}),
          disabled: true,
        });

        _.each(extensionalPropsFields, (field) => {
          if (_.has(extensionalPropsData, field)) {
            extensionalProps[field] = _.get(extensionalPropsData, field);
          }
        });

        fieldsElements.push(
          <ExtensionComponent key={formItemExtender} {...basicProps} {...extensionalProps} />,
        );
      }
    } else {
      _.map(sectionFields, (field) => {
        if (_.endsWith(_.get(field, 'render_type'), '_bar')) {
          fieldsElements.push(<BarViewItem layout={field} />);
          return fieldsElements;
        }
        const fieldObjectDesc = IndexDataParser.parserFieldLabel(field, currentDescription);
        const fieldApiName = _.get(fieldObjectDesc, 'api_name');
        const fieldData = _.get(basicInfo, field.field);

        if (
          objectDescribeApiName == 'call_template_detail' &&
          fieldApiName == 'day' &&
          !fieldData
        ) {
          return;
        }
        if (!checkSectionShowable(field, 'phone', 'detail')) {
          return;
        }

        const hideSection =
          _.indexOf(_.get(section, 'hidden_when'), 'detail') >= 0 ||
          Util.executeExpression(_.get(section, 'hidden_expression', 'return false'), basicInfo);
        if (hideSection) {
          return;
        }
        const userPrivilage = Privilege.checkFieldInOkArr(
          this.props.permission,
          objectDescribeApiName,
          field.field,
          [2, 4],
        );

        if (!userPrivilage && !_.endsWith(field.render_type, '_bar')) {
          return;
        }
        fieldsElements.push(
          <DetailFormItem
            key={fieldsElements.length + 1 + ''}
            token={token}
            navigation={navigation}
            parentData={basicInfo}
            fieldData={fieldData}
            objectApiName={objectDescribeApiName}
            fieldApiName={fieldApiName}
            fieldDesc={fieldObjectDesc}
            fieldLayout={field}
            callExtenderRefresh={callExtenderRefresh}
            pageType="detail"
          />,
        );
      });
    }

    // ? 库存
    const relateRefs = _.get(section, 'related_refs', []);
    if (relateRefs.length > 0) {
      _.each(relateRefs, (ref) => {
        let relatedComp;
        let detailFormLayout = {};
        _.each(components, (comp) => {
          if (comp.related_list_name && comp.related_list_name == ref.ref) {
            relatedComp = comp;
          }
          if (comp.type === 'detail_form') {
            detailFormLayout = comp;
          }
        });
        const actions = _.get(detailFormLayout, 'actions', []);
        let saveDefaultValue = [];
        let relatedParentData = _.cloneDeep(detailData);

        _.each(actions, (action) => {
          if (action.action === 'SAVE' && action.default_field_val && !detailData.id) {
            saveDefaultValue = action.default_field_val;
            _.each(saveDefaultValue, (deft) => {
              if (!relatedParentData) {
                relatedParentData = {};
              }
              relatedParentData[deft.field] = deft.val;
            });
          }
        });
        fieldsElements.push(
          <RelatedItem
            token={token}
            navigation={navigation}
            parentData={relatedParentData}
            layout={relatedComp}
            permission={permission}
            objectDescription={objectDescription}
            pageType="detail"
            pageTypeLevel={pageTypeLevel}
            component={components}
            isTopLevel={isTopLevel}
          />,
        );
      });
    }
    return fieldsElements;
  };
  composeBasicInfo = (basicInfo, layout) => {
    const {
      navigation,
      detailData,
      components,
      approvalFlowInfo,
      pageType,
      pageTypeLevel,
      isTopLevel,
    } = this.props;

    let resultElements = [];

    //* 老版审批流 详情显示按钮
    if (!_.isEmpty(_.get(approvalFlowInfo, 'approval_flow', {}))) {
      resultElements.push(
        <ApprovalFlowSection approvalFlowInfo={approvalFlowInfo} navigation={navigation} />,
      );
    }
    const fieldSections = _.get(layout, 'field_sections');
    _.each(fieldSections, (section, index) => {
      let fieldsElements = this.composeBasicInfo_section(section, basicInfo);
      fieldsElements = _.compact(fieldsElements);
      if (_.isEmpty(fieldsElements)) {
        return;
      }
      const sectionWrapper = (
        <View style={detailScreen_styles.sectionWrapperStyle}>{fieldsElements}</View>
      );
      if (index > 0) {
        const spacer = <VerticalSpacer height={10} />;
        resultElements.push(spacer);
      }
      resultElements.push(sectionWrapper);
    });

    let relateForm = [];
    const remainingComponents = components.slice(1);
    _.each(remainingComponents, (relateComponent) => {
      const modalViews = isExistModalView(
        relateComponent,
        detailData,
        navigation,
        pageType,
        pageTypeLevel,
        isTopLevel,
        components,
      );

      if (_.isArray(modalViews)) {
        relateForm = relateForm.concat(modalViews);
      }
    });

    if (relateForm.length) {
      resultElements.push(<VerticalSpacer height={10} />);
      resultElements = resultElements.concat(relateForm);
    }

    const workflowElem = <WorkFlowHeaderSection data={detailData} />;
    if (workflowElem) {
      resultElements.unshift(<VerticalSpacer height={10} />);
      resultElements.unshift(workflowElem);
    }
    return resultElements;
  };

  renderButtonList = (component: any, objectDescribeApiName: string) => {
    const { permission, detailData } = this.props;

    if (_.isEmpty(component)) {
      console.warn('component layuout is invalid');
      return;
    }

    const componentType = _.get(component, 'type');
    const actionList = _.filter(
      _.get(component, 'actions'),
      (action) =>
        componentType === 'related_list' ||
        _.indexOf(_.get(action, 'show_when'), ACTION_DETAIL) >= 0,
    );

    const buttonList = [];
    _.each(actionList, (action) => {
      const disableFun = _.get(action, 'disabled_expression', 'return false');
      const isDisabled = Util.executeExpression(disableFun, detailData);
      const hiddenFun = _.get(action, 'hidden_expression', 'return false');
      const isHidden = Util.executeExpression(hiddenFun, detailData);

      if (isHidden) {
        return;
      }

      const actionCode = _.toUpper(_.get(action, 'action'));
      const actionLabel = _.get(action, 'label');
      const actionRefObjectApiName = _.get(action, 'ref_obj_describe', objectDescribeApiName);

      if (
        Privilege.checkAction(actionCode, permission, actionRefObjectApiName) ||
        actionCode === 'RELATEDCOLLECT' ||
        actionCode === 'RESURVEY'
      ) {
        buttonList.push(
          this.createButton(isDisabled, action, actionLabel, () =>
            console.warn(`### ${actionCode}clicked`),
          ),
        );
      } else if (actionCode === 'CALLBACK') {
        // TODO: Does this needed? Return to last page? by Uncle Charles
      }
    });

    if (_.isEmpty(buttonList)) {
      return null;
    }

    return (
      <View
        style={{
          marginBottom: 5,
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
        }}
      >
        {buttonList}
      </View>
    );
  };

  componentDidUpdate(prevProps: Readonly<P>, prevState: Readonly<S>, snapshot: SS): void {
    console.logDidUpdateHash(top__filename, this, prevProps, prevState);
  }

  render() {
    return (
      <StyleProvider style={getDetailScreenViewingNativeBaseTheme()}>
        {this.renderConcrete()}
      </StyleProvider>
    );
  }

  renderConcrete() {
    const { dataError, detailData, layout, objectDescribeApiName, renderButtonList } = this.props;

    if (dataError) {
      return <ErrorScreen />;
    } else if (!detailData) {
      return <LoadingScreen />;
    }
    let contentStyle = {
      backgroundColor: '#F6F6F6',
      marginBottom: 5,
      padding: 10,
    };
    /**
     * check render button, if not , modify content style
     */
    if (renderButtonList) {
      contentStyle = Object.assign({}, contentStyle, {
        marginBottom: 55,
      });
    }

    // 现在有个潜在缺陷，如果刷新失败了，这个菊花并不会隐藏，因为没有setState({isRefreshing:false})
    // 要fix此潜在缺陷，有两种方式
    // 1、request出错后将错误信息return，目前没有做，需要改动的地方多
    // 2、request出错后用DeviceEventEmitter.emit事件，在view中用DeviceEventEmitter.addListener监听。改动的地方少

    const refreshingHeader = this.state.isRefreshing ? <SpinnerHeader /> : null;
    return (
      <Container style={{ backgroundColor: themes.fill_base }}>
        <Content style={contentStyle} removeClippedSubviews>
          {refreshingHeader}
          {this.renderMediaView()}
          {this.composeBasicInfo(detailData, layout)}
          <VerticalSpacer height={50} />
        </Content>
        {renderButtonList ? (
          <ButtonListContainer>
            {renderButtonList(layout, objectDescribeApiName)}
          </ButtonListContainer>
        ) : null}
      </Container>
    );
  }
}

const select = (state) => ({
  token: state.settings.token,
  objectDescription: state.settings.objectDescription,
  profile: state.settings.profile,
});

export default connect(select)(InnerUserInfoView);
