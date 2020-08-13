/**
 * eslint-disable react/no-unused-prop-types
 * Created by Uncle Charlie, 2017/12/11
 * 只做列表本身的渲染，辅助类的操作（表头，表尾都不做处理）
 * @flow
 */
import React from 'react';
import moment from 'moment';
import _ from 'lodash';
import { connect } from 'react-redux';
import { ListItem, Text, Icon, Badge } from 'native-base';
import { StyleSheet, View } from 'react-native';
import { StyledBadge } from '../../common/components';
import themes from '../../common/theme';
import { CustomTouch } from '../../../lib/androidWebview';
import HtmlComponent from '../../../tabs/common/components/HtmlComponent';
import * as Util from '../../../utils/util';
import theme from '../../../utils/theme';
import I18n from '../../../i18n';
import IcomoonIcon from '../../../lib/IcomoonIcon';

type Prop = {
  token: any,
  navigation: Object,
  onItemUpdate: () => void,
  defaultFieldVal: Object,
  crmPowerSetting: Object,
  userInfo: Object,
  styleObjects: Array<Object>,
  itemDataList: Array<Object>,
  objectDescription: Object,
  limitNum: number,
  isLimit: boolean,
};

class BaseList extends React.Component<Prop> {
  goToNoticeDetail = (data) => {
    const { userInfo, crmPowerSetting, navigation, onItemUpdate } = this.props;
    const payload = {
      head: {
        token: global.FC_CRM_TOKEN,
      },
      body: {
        user_info: userInfo.id,
        notice: data.id,
      },
    };

    navigation.navigate('NoticeDetail', {
      navParam: {
        data,
        onUpdate: onItemUpdate,
        needUpdate: crmPowerSetting.need_notice_read_log === true, // 不要给 needUpdate 赋默认值，业务对所有类型的值都有意义
        payload,
      },
    });
  };

  //跳转到详情
  goToDetail = (itemData) => {
    const { navigation, onItemUpdate, token, defaultFieldVal } = this.props;
    const objectApiName = _.get(itemData, 'object_describe_name');

    let payload = null;
    if (!_.isEmpty(defaultFieldVal)) {
      // defaultFieldVal 需配置
      const data = {};
      _.set(data, 'version', _.get(itemData, 'version'));
      _.set(data, 'id', _.get(itemData, 'id'));
      Util.setDefaultFieldVals(defaultFieldVal, itemData, data);
      const dealData = {
        head: { token },
        body: data,
      };
      payload = {
        dealData,
        object_api_name: objectApiName, // 需上层传递 ApiName
        id: _.get(itemData, 'id'), // 应该传递 recordId
      };
    }

    if (objectApiName === 'notice') {
      this.goToNoticeDetail(itemData);
    } else {
      navigation.navigate('Detail', {
        navParam: {
          id: _.get(itemData, 'id'),
          objectApiName,
          record_type: _.get(itemData, 'record_type'),
          from: 'HomePage',
          onUpdate: onItemUpdate,
          updateParams: payload ? [payload, false] : null,
        },
      });
    }
  };

  renderSystemContent = (content, itemData, objectDescription, extraStyle: Object = {}) => {
    const { navigation } = this.props;
    const textWrapper = (injectedStyle) => (htmlAttribs, children, convertedCSSStyles, { key }) => (
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        key={key}
        style={[convertedCSSStyles, injectedStyle]}
      >
        {children}
      </Text>
    );
    const itemDescription = getObjDescription(itemData, objectDescription);
    const result = [];
    if (content && content.length > 0) {
      _.each(content, (ctObj, index) => {
        const ctType = _.get(ctObj, 'field_type', '');
        const ctName = _.get(ctObj, 'name', '');
        const ctField = _.get(ctObj, 'field', '');
        const textStyle = {
          fontSize: ctObj.font_size || extraStyle.fontSize || theme.listItem.fontSize,
          fontWeight: ctObj.font_weight,
          fontFamily: theme.listItem.fontFamily,
          backgroundColor: ctObj.background_color || theme.listItem.backgroundColor,
          color: ctObj.color || extraStyle.color || theme.listItem.color,
        };

        if (ctType === 'custom') {
          result.push(
            <Text key={`${itemData.id}_${ctField}_${index}`} numberOfLines={2} style={textStyle}>
              {ctName}
            </Text>,
          );
        } else if (ctType === 'system') {
          const objectFields = _.get(itemDescription, 'fields', []);
          let fieldDes = {};
          _.each(objectFields, (objf) => {
            const fieldName = _.get(objf, 'api_name', '');
            if (ctField === fieldName) {
              fieldDes = objf;
            }
          });

          const renderType = _.get(fieldDes, 'type', '');
          const fieldText = getFieldByType(renderType, fieldDes, ctField, itemData);

          result.push(
            <HtmlComponent
              key={`${itemData.id}_${ctField}_${index}`}
              textStyle={textStyle}
              html={fieldText || ''}
              navigation={navigation}
              renderers={{ textwrapper: textWrapper(textStyle) }}
              numberOfLines={1}
            />,
          );
        }
      });
    }
    return <View style={{ flexDirection: 'row' }}>{result}</View>;
  };
}

const select = (state) => ({
  token: state.settings.token,
  userInfo: state.settings.userInfo,
  crmPowerSetting: state.settings.crmPowerSetting,
});

export const MainList = connect(select)(
  class extends BaseList {
    render() {
      const {
        styleObjects = [],
        itemDataList = [],
        objectDescription,
        limitNum = 0,
        isLimit = true,
      } = this.props;

      if (_.isEmpty(styleObjects) || itemDataList.length === 0) {
        return renderNoData();
      }

      const isLimitIndeed = isLimit && itemDataList.length > limitNum && limitNum !== 0;
      const data = isLimitIndeed ? _.take(itemDataList, limitNum) : itemDataList;

      return (
        <React.Fragment>
          {_.map(data, (itemData, index) =>
            this.renderListItem(
              itemData,
              styleObjects,
              objectDescription,
              index === data.length - 1,
            ),
          )}
        </React.Fragment>
      );
    }

    renderListItem(itemData, styleObjects, objectDescription, isLastOne) {
      const style = this.getStyleOfItem(itemData, styleObjects);
      return (_.isEmpty(style) ? this.renderItem : this.renderStyledItem).call(
        this,
        style,
        itemData,
        styleObjects,
        objectDescription,
        isLastOne,
      );
    }

    getStyleOfItem = (itemData, styleObjects) => {
      let dataStyle = {};

      _.each(styleObjects, (objStyle) => {
        const { objectApiName, criterias } = objStyle;
        const dataApiName = _.get(itemData, 'object_describe_name', '');
        if (dataApiName === objectApiName) {
          if (criterias && criterias.length > 0) {
            _.each(criterias, (cri) => {
              const field = cri.field;
              const realData = _.get(itemData, field, '');
              const criValue = _.get(cri, 'value', '');
              if (realData && criValue) {
                dataStyle = _.get(objStyle, 'render_style', {});
              }
            });
          } else {
            dataStyle = _.get(objStyle, 'render_style', {});
          }
        }
      });
      return dataStyle;
    };

    renderStyledItem(dataStyle, itemData, styleObjects, objectDescription, isLastOne) {
      const { tag, content, end } = dataStyle;
      const extraStyle = isLastOne ? { borderBottomWidth: 0 } : {};

      return (
        <ListItem style={[styles.listItemWrapper, extraStyle]} key={`${itemData.id}`}>
          <CustomTouch
            onPress={() => this.goToDetail(itemData)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              flex: 1,
              justifyContent: 'space-between',
            }}
          >
            <View style={styles.listItemLeft}>
              <StyledBadge
                badgeStyles={{
                  badge: {
                    backgroundColor: tag.background_color || '#64BAFA',
                    borderRadius: 3,
                    paddingTop: 0,
                    paddingBottom: 0,
                    paddingLeft: 4,
                    paddingRight: 4,
                    height: 14,
                    alignSelf: 'center',
                  },
                }}
                text={getTag(tag, itemData, objectDescription)}
              />
              <View style={{ flex: 1, marginLeft: 6 }}>
                {this.renderSystemContent(content, itemData, objectDescription)}
              </View>
            </View>
            <View style={styles.listItemRight}>
              {this.renderSystemContent(end, itemData, objectDescription, {
                color: '#999',
                fontSize: 13,
              })}
              <Icon name="ios-arrow-forward" style={styles.listItemArrow} />
            </View>
          </CustomTouch>
        </ListItem>
      );
    }

    renderItem(dataStyle, itemData, styleObjects, objectDescription) {
      const { tag, content, end } = dataStyle;

      return (
        <ListItem style={{ height: 50, paddingLeft: 13, marginLeft: 0 }} key={`${itemData.id}`}>
          <CustomTouch onPress={() => this.goToDetail(itemData)}>
            <View style={styles.listItemLeft}>
              <StyledBadge
                badgeStyles={{ badge: { backgroundColor: '#64BAFA', borderRadius: 5 } }}
                text={getTag(tag, itemData, objectDescription)}
              />
              {this.renderSystemContent(content, itemData, objectDescription)}
            </View>
            <View style={styles.listItemRight}>
              {this.renderSystemContent(end, itemData, objectDescription)}
              <Icon name="ios-arrow-forward" style={styles.listItemArrow} />
            </View>
          </CustomTouch>
        </ListItem>
      );
    }
  },
);

export const Artical = connect(select)(
  class extends BaseList {
    render() {
      const { styleObjects = [], itemDataList = [], objectDescription } = this.props;
      if (itemDataList.length > 0) {
        const data = itemDataList[0];
        let dataStyle = {};
        _.each(styleObjects, (objStyle) => {
          const { objectApiName, criterias } = objStyle;
          const dataApiName = _.get(data, 'object_describe_name', '');
          if (dataApiName === objectApiName) {
            if (criterias && criterias.length > 0) {
              _.each(criterias, (cri) => {
                const field = cri.field;
                const realData = _.get(data, field, '');
                const criValue = _.get(cri, 'value', '');
                if (
                  realData &&
                  criValue &&
                  _.toString(criValue).indexOf(_.toString(realData)) > -1
                ) {
                  dataStyle = _.get(objStyle, 'render_style', {});
                }
              });
            } else {
              dataStyle = _.get(objStyle, 'render_style', {});
            }
          }
        });
        const { tag = {}, content = [], title = [], moment_time = {} } = dataStyle;
        const tagType = _.get(tag, 'field_type', 'custom');
        return (
          <View>
            <CustomTouch
              onPress={() => {
                this.goToDetail(data);
              }}
            >
              <View style={styles.title}>
                <Badge>
                  <Text>{getTag(tag, data, objectDescription)}</Text>
                </Badge>
                {this.renderSystemContent(title, data, objectDescription)}
              </View>
              <View style={styles.subTitle}>
                <Text style={{ marginLeft: 10 }}>
                  {moment_time.field
                    ? moment.unix(data[moment_time.field] / 1000).format('YYYY-MM-DD HH:mm')
                    : null}
                </Text>
              </View>
              <Text style={styles.description}>
                {this.renderSystemContent(content, data, objectDescription)}
              </Text>
            </CustomTouch>
          </View>
        );
      }
      return <View />;
    }
  },
);
//  无数据时渲染
export const renderNoData = (itemName?: string = '') => (
  <View style={styles.noDataRemindStyle}>
    <IcomoonIcon
      name="icon-file-text2"
      style={[styles.remindTextStyle, { fontSize: 20, marginRight: 6 }]}
    />
    <Text style={styles.remindTextStyle}>暂无数据 ~</Text>
  </View>
);

/**
 * util function
 * @param {*} itemData
 * @param {*} objectDescription
 */
const getObjDescription = (itemData, objectDescription) => {
  const { items } = objectDescription;
  let itemDescription = {};
  _.each(items, (item) => {
    const apiName = _.get(item, 'api_name', '');
    const dataApiName = _.get(itemData, 'object_describe_name', '');
    if (apiName && apiName === dataApiName) {
      itemDescription = item;
    }
  });
  return itemDescription;
};

const getFieldByType = (renderType, fieldDes, field, itemData) => {
  switch (renderType) {
    case 'select_one':
      const { options } = fieldDes;
      const fieldValue = _.get(itemData, field, '');
      let theText = '';
      _.each(options, (option) => {
        const optionValue = _.get(option, 'value', '');
        if (optionValue === fieldValue) {
          theText = _.get(option, 'label', '');
        }
      });
      return theText;
    case 'long_text':
    case 'big_int':
    case 'number':
    case 'text':
      return _.get(itemData, field, '');
    case 'boolean':
    case 'relation':
    case 'date_time':
      const timeString = _.get(itemData, field, '');
      return timeString ? moment.unix(timeString / 1000).format('YYYY-MM-DD HH:mm') : '';
    case 'date':
    case 'select_many':
    default:
      return _.get(itemData, field, '');
  }
};

/**
 * @param {object} tag
 * @param {object} itemData
 * @param {object} objectDescription
 */
const getTag = (tag, itemData, objectDescription) =>
  _.get(tag, 'field_type', 'custom') === 'custom'
    ? _.get(tag, 'name', '')
    : getSystemTag(tag, itemData, objectDescription);

const getSystemTag = (tag, itemData, objectDescription) => {
  const itemDescription = getObjDescription(itemData, objectDescription);
  const { field } = tag;
  const objectFields = _.get(itemDescription, 'fields', []);
  let fieldDes = {};
  _.each(objectFields, (objf) => {
    const fieldName = _.get(objf, 'api_name', '');
    if (field === fieldName) {
      fieldDes = objf;
    }
  });

  const renderType = _.get(fieldDes, 'type', '');
  const fieldText = getFieldByType(renderType, fieldDes, field, itemData);
  return fieldText;
};

//innerStyle
const styles = StyleSheet.create({
  noDataStyle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    width: '100%',
    height: '100%',
  },
  noDataRemindStyle: {
    height: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.contentBackground,
  },
  remindTextStyle: {
    lineHeight: 20,
    fontSize: theme.listItem.mentionFontSize,
    color: theme.listItem.mentionFontColor,
    fontFamily: theme.listItem.fontFamily,
  },
  listItemText: {
    marginLeft: 5,
    marginRight: 5,
    fontSize: themes.font_size_base,
  },
  listItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    // width: 60,
    justifyContent: 'flex-end',
    maxWidth: '37%',
  },
  listItemArrow: {
    ...theme.home.listArrow,
    marginLeft: 6,
  },
  listItemRightText: {
    marginRight: 5,
  },
  listItemLeft: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
  },
  title: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    paddingTop: 10,
  },
  subTitle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    padding: 10,
  },
  description: {
    padding: 10,
  },
  listItemWrapper: {
    height: 50,
    marginLeft: 10,
    paddingRight: 10,
    borderColor: theme.listItem.dividerLineColor,
    borderBottomWidth: theme.listItem.dividerLineThickness,
  },
});
