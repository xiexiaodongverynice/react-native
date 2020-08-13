/**
 * Created by Uncle Charlie, 2018/01/11
 * @flow
 */

import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Left, Right, Icon, ListItem } from 'native-base';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import _ from 'lodash';
import QueryComposer from 'fc-common-lib/query-composer';

import { recordUpdateAction } from '../../actions/recordUpdate';
import { recordDeleteAction } from '../../actions/recordDelete';
import { nodeOperation } from '../../actions/approvalFlow';
import { needRefreshAttendee } from '../../actions/event';
import { toastError } from '../../utils/toast';
import * as Util from '../../utils/util';
import HttpRequest from '../../services/httpRequest';
import themes from './theme';
import { getSrc } from '../common/helpers/modalWidget';
import preventDuplicate from '../common/helpers/preventDuplicate';
import I18n from '../../i18n';
import NoDataPlaceholder from '../../components/common/NoDataPlaceholder';

// 文件夹展示思路：

// 展示顶层视图数据：
// 拿到初始源数据（所有的根据产品查出的媒体文件，所有的文件夹，所有的媒体文件和包含它的文件夹关系）
// 根据所有媒体文件和所有的媒体文件和包含它的文件夹关系反推出文件夹
// 通过递归所有的文件夹查出顶层文件夹
// 找到没有文件夹的文件和被推荐的文件

// 文件夹点击钻取：
// 点击时存储该文件夹id，根据所有的文件夹过滤出p_id == id的文件夹和所有的媒体文件和包含它的文件夹关系展示文件夹和文件

// 返回机制：
// 获取上级文件的id（在点击钻取的时候已经存起来了）根据所有的文件夹找到p_id == id的文件夹（也就是当前位置的爷爷）
// 再次调取文件钻取方法把爷爷传进去实现返回功能；
// 如果没有爷爷级的就说明要返回到顶层，从新初始化数据

// 对了配置里面有一个开关来控制是否用媒体文件夹的形式来展示数据
// const showClmFolder = _.get(global.CRM_SETTINGS, 'show_clm_folder', false);

type Action = {
  recordUpdateAction: (any) => void,
  recordDeleteAction: (any) => void,
  needRefreshAttendee: (boolean) => void,
  nodeOperation: (key: string) => (payload: Object, cb: void) => void,
};

type Prop = {
  orderBy: string,
  order: string,
  token: string,
  objectApiName: string,
  rowActionsList: Array<any>,
  actions: Action,
  phoneLayout: ?PhoneLayout,
  mobileLayout: ?any,
  criteria: Array<any>,
  territoryCriterias: Array<any>,
  navigation: Object,
  handleNav: (destination: string, param: ?{}) => void,
  refreshApiName: ?string,
  component: any,
  onComponentDidMount: void, //* 用于注册路由
  approvalCriterias: any, //* 用于approval条件筛选
  needRefresh: void,
  isFilter: any, //是否过滤状态
};

type State = {
  // rowId: ?string,
  data: Array<any>,
  refreshing: boolean,
  loadingMore: boolean,
  favChecked: boolean,
  // noReadCounts: number,
  // noReadAlert: any,
  // resultCount?: number,
  needRefresh?: boolean,
  // pageCount: number,
  noData: boolean,
  // stashSubOptions: Array<any>,
  stashSubFilter: Array, //* 筛选下属条件
  renderList: any,
  allFolders: any,
  allFolderRelation: any,
  allClm: any,
  goBackMark: boolean,
  parentFolderObj: any,
};

const FIRST_PAGE = 1;
const FAV_CRITERIA = { field: 'is_favorite', operator: '==', value: [true] };

// const ICON_TYPE = ['hco', 'hcp', 'pharmacy'];
// const ICON_TYPE_DATA = {
//   hco: {
//     iconName: 'medkit',
//   },
//   hcp: {
//     iconName: 'people',
//   },
//   pharmacy: {
//     iconName: 'ios-flask',
//   },
// };

class ClmPresentationListView extends React.Component<Prop, State> {
  pageNo: number = FIRST_PAGE;

  state = {
    data: [],
    refreshing: true,
    loadingMore: false,
    favChecked: false,
    noData: false,
    stashSubFilter: [],
    renderList: {},
    allFolders: {},
    // pageCount: 1,
    allFolderRelation: {},
    allClm: {},
    goBackMark: false,
    parentFolderObj: {},
  };
  eventListener;

  componentDidMount() {
    const { onComponentDidMount, objectApiName } = this.props;
    // if (_.isFunction(onComponentDidMount)) {
    //   onComponentDidMount(this.onRefresh);
    // }
    // this.territoryCriterias = territoryCriterias;
    this.onRefresh();
  }

  componentWillUnmount() {
    if (_.isFunction(_.get(this, 'eventListener.remove'))) {
      this.eventListener.remove();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { needRefresh, objectApiName, refreshApiName, actions } = this.props;

    if (needRefresh && objectApiName === refreshApiName) {
      this.setState({ refreshing: true });
      this.onRefresh();
      actions.needRefreshAttendee(false);
    }
  }

  // 选择状态后刷新的函数
  onRefresh = async () => {
    const { approvalCriterias, territoryCriterias = [] } = this.props;
    if (this.state.loadingMore) {
      return;
    }
    // this.pageNo = FIRST_PAGE;
    const { token, orderBy, order, criteria, objectApiName } = this.props;
    const { favChecked, stashSubFilter } = this.state;
    const composeCriteria = criteria.concat(stashSubFilter);
    let params = {
      token,
      objectApiName,
      criteria: favChecked ? _.concat(composeCriteria, FAV_CRITERIA) : composeCriteria,
      territoryCriterias,
      joiner: '',
      orderBy,
      order,
      pageSize: 10000,
      pageNo: 1,
    };

    if (!_.isEmpty(approvalCriterias)) {
      params = _.assign({}, params, { approvalCriterias });
    }

    const prodList = [];
    const listData = [];
    const renderList = {
      folderList: [],
      clmList: [],
      recommendClmList: [],
    };
    if (!_.isEmpty(criteria)) {
      _.map(criteria, (item, i) => {
        if (item.field == 'product' && !_.isEmpty(item.value)) {
          _.map(item.value, (ite, index) => {
            prodList.push(ite + '');
          });
        }
      });
    }
    // *媒体显示为文件夹样式
    const allFolderParams = {
      token,
      joiner: 'and',
      criteria: [],
      territoryCriterias: [],
      orderBy: 'create_time',
      order: 'asc',
      objectApiName: 'folder',
      pageSize: 10000,
      pageNo: 1,
    };

    const allFolderRelationParams = {
      token,
      joiner: 'and',
      criteria: [],
      territoryCriterias: [],
      orderBy: 'update_time',
      order: 'desc',
      objectApiName: 'clm_folder',
      pageSize: 10000,
      pageNo: 1,
    };
    // *初始化视图数据
    const allFolders = await HttpRequest.query(allFolderParams);
    const allFolderRelation = await HttpRequest.query(allFolderRelationParams);
    const allClm = await HttpRequest.query(params);

    _.map(_.get(allClm, 'result'), (clm, index) => {
      _.map(_.get(allFolderRelation, 'result'), (folderRelation, index) => {
        if (clm.id == folderRelation.clm) {
          // 文件有文件夹
          const folderItems = [];
          // *递归查找文件夹是否有父文件夹
          _.map(_.get(allFolders, 'result'), (fo, i) => {
            if (fo.id == folderRelation.folder && !_.includes(folderItems, fo)) {
              findParentFolder(fo);
              function findParentFolder(fo) {
                if (_.get(fo, 'parent_id', false)) {
                  const asd = _.find(_.get(allFolders, 'result'), (o) => o.id == fo.parent_id);
                  asd && findParentFolder(asd);
                } else {
                  folderItems.push(fo);
                }
              }
            }
          });
          if (!_.isEmpty(folderItems)) {
            _.map(folderItems, (ite) => {
              if (!_.includes(listData, ite)) {
                listData.push(ite);
                renderList.folderList.push(ite);
              }
            });
          }
          // 有文件夹且是被推荐的
          if (clm.is_recommend && !_.includes(listData, clm)) {
            listData.push(clm);
            renderList.recommendClmList.push(clm);
          }
        } else if (
          clm &&
          !_.includes(listData, clm) &&
          !_.find(_.get(allFolderRelation, 'result'), (re, i) => re.clm == clm.id)
        ) {
          // 文件没有文件夹
          listData.push(clm);
          // 没有文件夹且被推荐的
          clm.is_recommend ? renderList.recommendClmList.push(clm) : renderList.clmList.push(clm);
        }
      });
    });

    console.log(renderList, allFolders, allFolderRelation, allClm, 'renderList===>');
    // _.orderBy(users, ['age'],)
    this.setState({
      refreshing: false,
      loadingMore: false,
      noData: !listData.length,
      renderList: {
        folderList: _.orderBy(renderList.folderList, ['display_order']),
        clmList: _.orderBy(renderList.clmList, ['display_order']),
        recommendClmList: _.orderBy(renderList.recommendClmList, ['display_order']),
      },
      allFolders,
      allFolderRelation,
      allClm,
    });
  };

  setDefaultFieldVals = (defaultFieldVals, record, data) => {
    _.forEach(defaultFieldVals, (defaultFieldValLayout) => {
      const defaultVal = defaultFieldValLayout.val;
      const defaultField = defaultFieldValLayout.field;
      if (_.eq(_.get(defaultFieldValLayout, 'field_type'), 'js')) {
        const resultVal = Util.executeExpression(defaultVal, record);
        _.set(data, defaultField, resultVal);
      } else {
        _.set(data, defaultField, defaultVal);
      }
    });
  };

  isNavigateToDetail = (item, detailAction) => {
    if (_.isEmpty(detailAction)) {
      return false;
    }

    const expression = _.get(detailAction, 'show_expression', ' return true;');
    return Util.executeExpression(expression, item);
  };

  onPressTouchableOpacity = (item, detailAction, canNavigateToDetail) => {
    const { actions, token, objectApiName, navigation } = this.props;
    const actionCode = _.get(detailAction, 'action');

    if (_.isEmpty(detailAction) || canNavigateToDetail === false) {
      return;
    }

    if (actionCode === 'MODAL_WIDGET') {
      // 打开webview页面
      const { options: actionOptions = {}, label } = detailAction;
      const { params = {}, src } = actionOptions;
      if (!src) {
        toastError(I18n.t('ClmPresentationListView.ExternalLinkLosted'));
        return;
      }

      navigation.navigate('WebView', {
        navParam: {
          external_page_src: `${getSrc(src)}?${QueryComposer.fromObject(
            Util.mapObject(params, { thizRecord: item }),
          )}`,
          label,
          showBack: true,
        },
      });
      return;
    }

    const defaultFieldVal = _.get(detailAction, 'default_field_val', []);
    const showAlert = _.get(detailAction, 'show_alert', true);

    let recordId = '';
    let targetRecordType = '';
    const targetApiName = objectApiName;

    recordId = _.get(item, 'id');
    targetRecordType = _.get(detailAction, 'target_layout_record_type', _.get(item, 'record_type'));

    if (!_.isEmpty(defaultFieldVal)) {
      const data = {};
      _.set(data, 'version', _.get(item, 'version'));
      _.set(data, 'id', _.get(item, 'id'));
      this.setDefaultFieldVals(defaultFieldVal, item, data);
      const dealData = {
        head: { token },
        body: data,
      };
      const payload = {
        dealData,
        object_api_name: targetApiName,
        id: _.get(item, 'id'),
      };
      actions.recordUpdateAction(payload, showAlert, this.onRefresh);
    }

    navigation.navigate('Detail', {
      navParam: {
        objectApiName: targetApiName,
        record_type: targetRecordType,
        id: recordId,
        callback: this.onRefresh,
      },
    });
  };

  renderListItem() {
    const { renderList } = this.state;
    const { isFilter } = this.props;
    const folderList = _.get(renderList, 'folderList', []);
    const clmList = _.get(renderList, 'clmList', []);
    const recommendClmList = _.get(renderList, 'recommendClmList', []);
    return (
      <View>
        {isFilter ? (
          this.renderFilterClm()
        ) : (
          <View>
            {this.renderGoUpFolder()}
            {!_.isEmpty(folderList) ? this.renderFolderItem() : null}
            {!_.isEmpty(recommendClmList)
              ? this.renderClmItem(recommendClmList, 'recommend')
              : null}
            {!_.isEmpty(clmList) ? this.renderClmItem(clmList, 'clm') : null}
          </View>
        )}
      </View>
    );
  }

  // *文件夹渲染
  renderFolderItem() {
    const { renderList } = this.state;
    const folderList = _.get(renderList, 'folderList', []);
    return (
      <View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            height: 30,
            backgroundColor: themes.fill_subheader,
            paddingHorizontal: 10,
          }}
        >
          <Left>
            <Text>{I18n.t('ClmPresentationListView.Text.Folder')}</Text>
          </Left>
        </View>
        {_.map(folderList, (ite, i) => (
          <View style={styles.item_content} key={`文件夹${i}`}>
            <ListItem
              icon
              onPress={preventDuplicate(() => {
                this.renderChlidrenFolder(ite);
              })}
              style={{ justifyContent: 'space-between' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="ios-folder" style={{ color: '#c6c6c6' }} />
                <Text style={{ marginLeft: 10 }}>{ite.name}</Text>
              </View>
              <Right>
                <Icon name="ios-arrow-forward" />
              </Right>
            </ListItem>
          </View>
        ))}
      </View>
    );
  }

  // *文件渲染
  renderClmItem(clmList, renderClmType) {
    const { rowActionsList, phoneLayout, mobileLayout } = this.props;

    const detailAction = _.find(rowActionsList, (action: any) => {
      const actionCode = _.get(action, 'action');
      return (
        actionCode === 'DETAIL' || actionCode === 'PARENTDETAIL' || actionCode === 'RELATEDDETAIL'
      );
    });

    return (
      <View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            height: 30,
            backgroundColor: themes.fill_subheader,
            paddingHorizontal: 10,
          }}
        >
          <Left>
            <Text>
              {renderClmType == 'recommend'
                ? I18n.t('ClmPresentationListView.Text.RecommendedMedia')
                : I18n.t('ClmPresentationListView.Text.OtherMedia')}
            </Text>
          </Left>
        </View>
        {_.map(clmList, (ite, i) => (
          <View
            style={styles.item_content}
            key={
              renderClmType == 'recommend'
                ? `${I18n.t('ClmPresentationListView.Text.RecommendedMedia')}${i}`
                : `${I18n.t('ClmPresentationListView.Text.OtherMedia')}${i}`
            }
          >
            <ListItem
              icon
              onPress={preventDuplicate(() => {
                const canNavigateToDetail = this.isNavigateToDetail(ite, detailAction);
                this.onPressTouchableOpacity(ite, detailAction, canNavigateToDetail);
              })}
              style={{
                justifyContent: 'space-between',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Icon name="ios-paper" style={{ color: '#c6c6c6' }} />
                <Text style={{ marginLeft: 10 }}>{ite.name || ''}</Text>
              </View>
              <Right>
                <Icon name="ios-arrow-forward" />
              </Right>
            </ListItem>
          </View>
        ))}
      </View>
    );
  }

  // *文件夹钻取
  renderChlidrenFolder(parentFolder) {
    if (_.isEmpty(parentFolder)) return false;
    const parentFolderId = _.get(parentFolder, 'id');
    const chlidrenFolders = [];
    const chlidrenClms = [];
    const { allFolders, allFolderRelation, allClm } = this.state;

    // 获取包含该id的子文件夹
    _.map(_.get(allFolders, 'result'), (fo, i) => {
      if (fo.parent_id == parentFolderId && !_.includes(chlidrenFolders, fo)) {
        chlidrenFolders.push(fo);
      }
    });

    // 获取包含该id的文件
    // 目前二级未显示推荐文件，如需显示做一层isrecommend判断
    _.map(_.get(allFolderRelation, 'result'), (re, i) => {
      if (re.folder == parentFolderId) {
        _.map(_.get(allClm, 'result'), (cl, i) => {
          if (re.clm == cl.id && !_.includes(chlidrenClms, cl)) {
            chlidrenClms.push(cl);
          }
        });
      }
    });
    this.setState({
      renderList: {
        folderList: _.orderBy(chlidrenFolders, ['display_order']),
        clmList: _.orderBy(chlidrenClms, ['display_order']),
        recommendClmList: [],
      },
      noData: _.isEmpty(chlidrenFolders) && _.isEmpty(chlidrenClms) && true,
      goBackMark: true,
      parentFolderObj: parentFolder,
    });
  }

  // *返回上级按钮
  renderGoUpFolder() {
    const { goBackMark } = this.state;
    if (!goBackMark) return null;
    return (
      <TouchableOpacity
        onPress={preventDuplicate(() => {
          this.goParentFolder();
        })}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            height: 30,
            paddingHorizontal: 10,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              flex: 1,
            }}
          >
            <Icon name="ios-share-alt" style={{ color: '#c6c6c6' }} />
            <Text style={{ marginLeft: 10 }}>{I18n.t('ClmPresentationListView.Text.GoUp')}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // *返回上级按钮事件
  goParentFolder() {
    const { parentFolderObj, allFolders } = this.state;
    if (!_.isEmpty(parentFolderObj)) {
      const grandpaFolderObj = _.find(
        _.get(allFolders, 'result'),
        (fo, i) => fo.id == parentFolderObj.parent_id,
      );
      if (grandpaFolderObj) {
        this.renderChlidrenFolder(grandpaFolderObj);
      } else {
        this.setState({
          goBackMark: false,
          renderList: {},
          // noData: true,
        });
        this.onRefresh();
      }
    } else {
      this.setState({
        renderList: {},
        goBackMark: false,
      });
      this.onRefresh();
    }
  }

  renderFilterClm() {
    const { allClm } = this.state;
    if (_.isEmpty(_.get(allClm, 'result', []))) {
      this.setState({
        noData: true,
      });
      return false;
    }
    const { rowActionsList, phoneLayout, mobileLayout } = this.props;
    const detailAction = _.find(rowActionsList, (action: any) => {
      const actionCode = _.get(action, 'action');
      return (
        actionCode === 'DETAIL' || actionCode === 'PARENTDETAIL' || actionCode === 'RELATEDDETAIL'
      );
    });
    return (
      <View>
        <View
          style={
            {
              // flexDirection: 'row',
              // alignItems: 'center',
              // height: 30,
              // backgroundColor: themes.fill_subheader,
              // paddingHorizontal: 10,
            }
          }
        >
          {_.map(_.get(allClm, 'result', []), (ite, i) => (
            <View style={styles.item_content} key={`媒体${i}`}>
              <ListItem
                icon
                onPress={preventDuplicate(() => {
                  const canNavigateToDetail = this.isNavigateToDetail(ite, detailAction);
                  this.onPressTouchableOpacity(ite, detailAction, canNavigateToDetail);
                })}
                style={{
                  justifyContent: 'space-between',
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Icon name="ios-paper" style={{ color: '#c6c6c6' }} />
                  <Text style={{ marginLeft: 10 }}>{ite.name || ''}</Text>
                </View>
                <Right>
                  <Icon name="ios-arrow-forward" />
                </Right>
              </ListItem>
            </View>
          ))}
        </View>
      </View>
    );
  }

  render() {
    const { component, phoneLayout } = this.props;
    const { loadingMore, noData, data, refreshing } = this.state;

    return (
      <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'stretch' }}>
        {!noData ? (
          this.renderListItem()
        ) : (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
            }}
          >
            {this.renderGoUpFolder()}
            <NoDataPlaceholder />
          </View>
        )}
      </View>
    );
  }
}

const select = (state) => ({
  token: state.settings.token,
  recordUpdateStatus: state.recordUpdate.status,
  needRefresh: state.event.needRefresh,
  refreshApiName: state.event.refreshApiName,
});

const act = (dispatch) => ({
  actions: bindActionCreators(
    {
      recordUpdateAction,
      recordDeleteAction,
      needRefreshAttendee,
      nodeOperation,
    },
    dispatch,
  ),
});

export default connect(select, act, null, {
  withRef: true,
})(ClmPresentationListView);

const styles = StyleSheet.create({
  rowItem: {
    flex: 1,
    alignSelf: 'stretch',
    backgroundColor: 'blue',
    alignItems: 'stretch',
    borderBottomWidth: themes.regular_border_width,
    borderBottomColor: themes.border_color_base,
  },
  icon: {
    fontSize: themes.icon_size_index,
    color: '#BEC2C9',
    marginRight: 10,
  },
  arrowIcon: {
    color: themes.color_header_icon,
    fontSize: themes.font_header_size,
    marginLeft: 10,
  },
  favorite: {
    fontSize: themes.icon_size_index,
    color: '#FACC2D',
  },
  nodata: {
    fontSize: 100,
    color: 'lightgray',
  },
  item_content: {
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
});
