/*
 * Created by Uncle Charlie, 2017/12/22
 * @flow
 */

import React from 'react';
import { FlatList, Text, View, Image, Platform, StyleSheet, TouchableOpacity } from 'react-native';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import _ from 'lodash';
import { Body, Button, Container, Content, Right, ListItem, Icon, Left } from 'native-base';
import Input from '../../lib/Input';
import { HeaderLeft, StyledHeader } from '../common/components';
import optionAction from '../../actions/options';
import I18n from '../../i18n';
import OptionItem from '../common/OptionItem';
import themes from '../common/theme';
import preventDuplicate from '../common/helpers/preventDuplicate';
import NoDataPlaceholder from '../../components/common/NoDataPlaceholder';

const STATUS_CLEAR = 'clear';

type Prop = {
  navigation: any,
  actions: {
    optionAction: (selected: ?Array<any>) => { type: string, payload: any },
  },
};

type State = {
  selected: Array<any>,
  renderList: any,
  parentFolderObj: any,
  noData: any,
  isFilter: any,
};
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

class OptionSelect extends React.Component<Prop, State> {
  state = {
    selected: [],
    options: [],
    multipleSelect: false,
    renderList: {},
    parentFolderObj: {},
    noData: false,
    isFilter: false,
  };
  value = '';
  componentDidMount = () => {
    const { navigation } = this.props;
    const { params } = navigation.state;
    const multipleSelect = _.get(params, 'multipleSelect');
    const showClmFolder = _.get(global.CRM_SETTINGS, 'show_clm_folder', false);

    if (showClmFolder) {
      this.initClmFolderViewData();
    }

    //* 当selected为null进行如下处理
    let selected = _.get(params, 'selected') ? _.cloneDeep(_.get(params, 'selected')) : [];
    const isAllSelected = _.get(navigation, 'state.params.isAllSelected');
    const { options } = params;
    console.log(options, 'options=======>');
    if (isAllSelected) {
      selected = _.cloneDeep(options);
      this.setState({
        selected,
        options,
        multipleSelect,
      });
    } else if (selected && selected.length > 0) {
      this.setState({
        selected,
        options,
        multipleSelect,
      });
    } else {
      this.setState({
        selected,
        options,
        multipleSelect,
      });
    }
    this.fixSelected = options;
  };

  componentWillUnmount() {
    const { navigation } = this.props;
    const clearTime = _.get(navigation, 'state.params.clearTime');
    if (_.isFunction(clearTime)) {
      console.log('clear time');
      clearTime();
    }
  }

  initClmFolderViewData = (newClmData) => {
    const { navigation } = this.props;
    const { params } = navigation.state;
    const clmData = newClmData || _.get(params, 'clmData');
    const clmFolderData = _.get(params, 'clmFolderData');
    const allFolderRelationList = _.get(params, 'allFolderRelationList');
    const listData = [];
    const renderList = {
      folderList: [],
      clmList: [],
      recommendClmList: [],
    };
    _.map(clmData, (clm, index) => {
      _.map(allFolderRelationList, (folderRelation, index) => {
        if (clm.id == folderRelation.clm) {
          // 文件有文件夹
          const folderItems = [];
          _.map(clmFolderData, (fo, i) => {
            if (fo.id == folderRelation.folder && !_.includes(folderItems, fo)) {
              findParentFolder(fo);
              function findParentFolder(fo) {
                if (_.get(fo, 'parent_id', false)) {
                  const asd = _.find(clmFolderData, (o) => o.id == fo.parent_id);
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
          !_.find(allFolderRelationList, (re, i) => re.clm == clm.id)
        ) {
          // 文件没有文件夹
          listData.push(clm);
          // 没有文件夹且被推荐的
          clm.is_recommend ? renderList.recommendClmList.push(clm) : renderList.clmList.push(clm);
        }
      });
    });
    console.log(renderList, clmFolderData, clmData, allFolderRelationList, 'renderList===>');
    this.setState({
      renderList: {
        folderList: _.orderBy(renderList.folderList, ['display_order']),
        clmList: _.orderBy(renderList.clmList, ['display_order']),
        recommendClmList: _.orderBy(renderList.recommendClmList, ['display_order']),
      },
      noData:
        _.isEmpty(renderList.folderList) &&
        _.isEmpty(renderList.clmList) &&
        _.isEmpty(renderList.recommendClmList) &&
        true,
    });
  };

  handleSelection = (item) => {
    const { navigation } = this.props;
    const { params } = navigation.state;
    if (!params.multipleSelect) {
      this.setState(
        {
          selected: [item],
        },
        this.selectDone,
      );
    } else {
      const { selected } = this.state;
      const exists = _.findIndex(selected, item);
      if (exists >= 0) {
        selected.splice(exists, 1);
      } else {
        selected.push(item);
      }
      this.setState({
        selected,
      });
    }
  };

  selectDone = (status) => {
    const { actions, navigation } = this.props;
    const { params } = navigation.state;
    const resultSelected = status === STATUS_CLEAR ? [] : this.state.selected;
    params.callback({
      selected: resultSelected,
      multipleSelect: params.multipleSelect,
      apiName: params.apiName,
    });

    // TODO: deprecated
    actions.optionAction(resultSelected);
    navigation.goBack();
  };

  renderItem = ({ item }) => {
    const { multipleSelect } = this.state;
    let exists;
    if (item.value) {
      exists = _.find(this.state.selected, (sl) => sl.value === item.value);
    } else if (item.id) {
      exists = _.find(this.state.selected, (sl) => sl.id === item.id);
    }

    const key = item.value ? `${item.value}` : `${item.id}`;
    return (
      <OptionItem
        key={`${key}`}
        item={item}
        multipleSelect={multipleSelect}
        marked={!!exists}
        handleSelection={this.handleSelection}
      />
    );
  };

  searchPressed = (event) => {
    const showClmFolder = _.get(global.CRM_SETTINGS, 'show_clm_folder', false);
    const { navigation } = this.props;
    const { params } = navigation.state;
    const clmData = _.get(params, 'clmData');
    const queryName = event.nativeEvent.text ? event.nativeEvent.text.trim() : this.value;
    const options = _.cloneDeep(this.fixSelected);
    if (queryName.length > 0) {
      this.setState({
        isFilter: true,
      });
      if (options && options.length > 0) {
        const newOptions = [];
        _.each(options, (select) => {
          const label = _.get(select, 'label', undefined);
          if (label && label.indexOf(queryName) > -1) {
            newOptions.push(select);
          }
        });
        this.setState({ options: newOptions });
      }
      if (showClmFolder) {
        if (clmData && clmData.length > 0) {
          const newClmData = [];
          _.each(clmData, (clm) => {
            const name = _.get(clm, 'name', undefined);
            if (name && name.indexOf(queryName) > -1) {
              newClmData.push(clm);
            }
          });
          if (!_.isEmpty(newClmData)) {
            this.initClmFolderViewData(newClmData);
          } else {
            this.setState({
              renderList: {},
              noData: true,
            });
          }
        }
      }
    } else {
      this.setState({ options, isFilter: false });
    }
  };

  setValue = (e) => {
    const queryName = e.nativeEvent.text.trim();
    this.value = queryName;
  };

  clearInput = () => {
    const showClmFolder = _.get(global.CRM_SETTINGS, 'show_clm_folder', false);
    const options = _.cloneDeep(this.fixSelected);
    this.value = '';
    this.setState({ options, isFilter: false });
    showClmFolder && this.initClmFolderViewData();
  };

  renderFolderListItem() {
    const { renderList } = this.state;
    const folderList = _.get(renderList, 'folderList', []);
    const clmList = _.get(renderList, 'clmList', []);
    const recommendClmList = _.get(renderList, 'recommendClmList', []);
    return (
      <View>
        {this.renderGoUpFolder()}
        {!_.isEmpty(folderList) ? this.renderFolderItem() : null}
        {!_.isEmpty(recommendClmList) ? this.renderClmItem(recommendClmList, 'recommend') : null}
        {!_.isEmpty(clmList) ? this.renderClmItem(clmList, 'clm') : null}
      </View>
    );
  }

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
            <Text>{I18n.t('OptionSelect.Folder')}</Text>
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

  renderClmItem = (clmList, renderClmType) => {
    const { renderList } = this.state;
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
                ? I18n.t('OptionSelect.Recommend')
                : I18n.t('OptionSelect.Other')}
            </Text>
          </Left>
        </View>
        {_.map(clmList, (ite, i) => (
          <View
            style={styles.item_content}
            key={
              renderClmType == 'recommend'
                ? `${I18n.t('OptionSelect.Recommend')}${i}`
                : `${I18n.t('OptionSelect.Other')}${i}`
            }
          >
            <ListItem
              icon
              onPress={preventDuplicate(() => {
                this.onPressSelectClmFromFolderEvent(ite);
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
  };

  renderChlidrenFolder(parentFolder) {
    if (_.isEmpty(parentFolder)) return false;
    const parentFolderId = _.get(parentFolder, 'id');
    const chlidrenFolders = [];
    const chlidrenClms = [];
    const chlidrenRecommendClms = [];
    const { navigation } = this.props;
    const { params } = navigation.state;
    const clmData = _.get(params, 'clmData');
    const clmFolderData = _.get(params, 'clmFolderData');
    const allFolderRelationList = _.get(params, 'allFolderRelationList');

    // 获取包含该id的子文件夹
    _.map(clmFolderData, (fo, i) => {
      if (fo.parent_id == parentFolderId && !_.includes(chlidrenFolders, fo)) {
        chlidrenFolders.push(fo);
      }
    });

    // 获取包含该id的文件
    // 目前二级未显示推荐文件，如需显示做一层isrecommend判断
    _.map(allFolderRelationList, (re, i) => {
      if (re.folder == parentFolderId) {
        _.map(clmData, (cl, i) => {
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
            <Text style={{ marginLeft: 10 }}>{I18n.t('OptionSelect.ReturnToUpLevel')}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  goParentFolder() {
    const { navigation } = this.props;
    const { params } = navigation.state;
    const clmFolderData = _.get(params, 'clmFolderData');
    const { parentFolderObj } = this.state;
    if (!_.isEmpty(parentFolderObj)) {
      const grandpaFolderObj = _.find(clmFolderData, (fo, i) => fo.id == parentFolderObj.parent_id);
      if (grandpaFolderObj) {
        this.renderChlidrenFolder(grandpaFolderObj);
      } else {
        this.setState({
          goBackMark: false,
          renderList: {},
        });
        this.initClmFolderViewData();
      }
    } else {
      this.setState({
        renderList: {},
        goBackMark: false,
      });
      this.initClmFolderViewData();
    }
  }

  onPressSelectClmFromFolderEvent = (ite) => {
    // *处理一下原始item符合handleSelection这个方法的参数
    const item = {
      label: ite.name,
      value: ite.id,
    };
    this.handleSelection(item);
  };

  renderNoDataView = () => (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
      }}
    >
      {this.renderGoUpFolder()}
      <NoDataPlaceholder />
    </View>
  );

  render() {
    const { multipleSelect, noData, isFilter } = this.state;
    const { navigation } = this.props;
    const { params } = navigation.state;
    const pageTitle = _.get(params, 'fieldDesc.label', '选择');
    const showClmFolder = _.get(global.CRM_SETTINGS, 'show_clm_folder', false);
    const isFromClm = _.get(params, 'isFromClm', false); //是否从拜访的添加媒体进入
    let renderMarker = false;
    if (isFromClm) {
      // 媒体列表根据CRMStting的showClmFolder来判断是否显示文件夹
      // 业务需要 通过内幕筛选后的数据展示只显示文件不显示文件夹，故增加了isFilter字段
      renderMarker = showClmFolder ? !isFilter : false;
    }
    return (
      <Container style={{ backgroundColor: themes.fill_base }}>
        <StyledHeader>
          <HeaderLeft navigation={navigation} />
          <Body style={{ alignItems: 'center', flex: 1 }}>
            <Text
              style={{
                color: themes.title_text_color,
                fontSize: 16,
              }}
            >
              {pageTitle}
            </Text>
          </Body>
          <Right>
            {multipleSelect ? (
              <Button transparent onPress={() => this.selectDone()}>
                <Text style={{ color: themes.title_text_color }}>{I18n.t('common_sure')}</Text>
              </Button>
            ) : !showClmFolder ? (
              <Button transparent onPress={() => this.selectDone(STATUS_CLEAR)}>
                <Text style={{ color: themes.title_text_color }}>{I18n.t('Header.Clear')}</Text>
              </Button>
            ) : null}
          </Right>
        </StyledHeader>
        <View
          style={{
            height: 50,
            padding: 10,
            flexWrap: 'nowrap',
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 5,
            paddingBottom: 15,
            borderBottomWidth: 0.5,
            borderBottomColor: '#AFB8BB',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              height: 40,
              padding: 5,
              alignItems: 'center',
              backgroundColor: '#F4F4F4',
              borderRadius: 8,
              width: '88%',
            }}
          >
            <View
              style={{
                paddingTop: 10,
                paddingBottom: 10,
                paddingLeft: 8,
                paddingRight: 5,
                alignItems: 'center',
              }}
            >
              <Image style={{ height: 15, width: 15 }} source={require('../img/search.png')} />
            </View>
            <Input
              placeholder={I18n.t('common_search')}
              returnKeyType="search"
              onSubmitEditing={this.searchPressed}
              placeholderTextColor="#999"
              onChange={this.setValue}
              defaultValue={this.value}
              style={{
                color: '#999',
                fontSize: 13,
                lineHeight: Platform.OS === 'android' ? 20 : 0,
              }}
            />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                // marginTop:'20'
              }}
            >
              <View style={{ width: 1, height: 20, backgroundColor: '#ccc', marginRight: 14 }} />
              <Text
                style={{
                  color: '#666',
                  fontSize: 13,
                  marginRight: 9,
                }}
                onPress={this.searchPressed}
              >
                {I18n.t('OptionSelect.Search')}
              </Text>
            </View>
          </View>
          <View>
            <Text
              style={{
                color: '#529FE0',
                fontSize: 15,
                marginLeft: 11,
              }}
              onPress={this.clearInput}
            >
              {I18n.t('OptionSelect.Reset')}
            </Text>
          </View>
        </View>
        <Content>
          <View>
            {renderMarker ? (
              <View>{noData ? this.renderNoDataView() : this.renderFolderListItem()}</View>
            ) : (
              <FlatList
                data={this.state.options}
                extraData={this.state}
                renderItem={this.renderItem}
              />
            )}
          </View>
        </Content>
      </Container>
    );
  }
}

const act = (dispatch) => ({
  actions: bindActionCreators(
    {
      optionAction,
    },
    dispatch,
  ),
});

export default connect(null, act)(OptionSelect);

const styles = StyleSheet.create({
  item_content: {
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
});
