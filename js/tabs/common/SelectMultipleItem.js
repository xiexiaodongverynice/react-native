/**
 * Created by Uncle Charlie, 2018/03/14
 * @flow
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Left, Body, ListItem } from 'native-base';
import _ from 'lodash';
import HttpRequest from '../../services/httpRequest';
import { callAnotherFunc, executeDetailExp } from '../../utils/util';
import { processCriterias } from '../../utils/criteriaUtil';
import { TipIcon, TipContent } from '../../components/formComponents/common';

type Prop = {
  title: string,
  fieldLayout: any,
  fieldData: any,
  fieldObjectDesc: any,
  // renderType: string,
  callExtenderRefresh: boolean, //* 回调刷新
};

type State = {
  requestError: any,
};

export default class SelectMultipleItem extends React.PureComponent<Prop, State> {
  state: State = {
    requestError: null,
    loading: true,
    showTipContent: false,
  };

  constructor(props: Prop) {
    super(props);

    const { fieldLayout, fieldObjectDesc } = this.props;

    this.objectApiName = _.get(fieldLayout, 'data_source.object_api_name');
    this.criteria = _.get(fieldLayout, 'data_source.criterias', []);
    this.targetField = _.get(fieldLayout, 'data_source.target_field');
    this.fieldDataSourde = _.get(fieldLayout, 'data_source');
    this.renderLabelExpression = _.get(fieldLayout, 'renderFieldItem');
    this.desOptions = _.get(fieldObjectDesc, 'options', []);
  }

  componentDidMount() {
    this.refresh();
  }

  async componentWillReceiveProps(nextprops) {
    const { callExtenderRefresh: currentRefreshStatus } = this.props;
    const nextRefreshStatus = _.get(nextprops, 'callExtenderRefresh');
    // const currentRefreshStatus = _.get(props, 'callExtenderRefresh');
    if (
      _.isBoolean(nextRefreshStatus) &&
      _.isBoolean(currentRefreshStatus) &&
      nextRefreshStatus !== currentRefreshStatus
    ) {
      await this.refresh(nextprops);
    }
  }

  refresh = async (props) => {
    const { token, fieldData, fieldLayout } = props || this.props;
    if (!fieldData || _.isEmpty(fieldData)) return;
    const fieldValueList = _.split(_.toString(fieldData), ',');
    if (!this.fieldDataSourde || !_.isArray(fieldValueList)) {
      return;
    }

    // 修改格式不正确的查询条件
    const valueList = [];
    fieldValueList.forEach((val) => {
      if (typeof val === 'string') {
        if (val.indexOf('[') > -1) {
          val = _.replace(val, '[', '');
        }
        if (val.indexOf(']') > -1) {
          val = _.replace(val, ']', '');
        }
      }
      valueList.push(val);
    });

    const enablecAsyncCriterias = _.get(this.fieldDataSourde, 'enablec_async_criterias', false);

    const fieldValueListCriterias = [
      {
        field: this.targetField ? `${this.targetField}.id` : 'id',
        operator: 'in',
        value: fieldData ? valueList : [],
      },
    ];

    const criteria = enablecAsyncCriterias
      ? _.concat(processCriterias(this.criteria, fieldData), fieldValueListCriterias)
      : fieldValueListCriterias;

    try {
      const result = await HttpRequest.query({
        token,
        objectApiName: this.objectApiName,
        joiner: 'and',
        criteria,
        pageNo: 1,
        pageSize: _.get(fieldData, 'length', 10),
      });

      const itemValue = _.map(_.get(result, 'result'), (item) => {
        let targetFieldObj = item;
        if (!_.isEmpty(this.targetField)) {
          targetFieldObj = _.get(item, this.targetField);
        }

        /**
         * 解析自定义label
         */
        if (!_.isUndefined(this.renderLabelExpression)) {
          if (this.renderLabelExpression.indexOf('return ') !== -1) {
            const label = callAnotherFunc(
              new Function('t', this.renderLabelExpression),
              targetFieldObj,
            );
            return label;
          }
        }
        return targetFieldObj;
      });
      this.setState({ itemValue });
    } catch (e) {
      console.warn('[warn] SelectMultipleItem', e);
    }
  };

  renderValue = (value) => <Text>{value}</Text>;

  renderItems = () => {
    const { fieldLayout } = this.props;
    const labelExp = _.get(fieldLayout, 'render_label_expression');
    const itemValueList = _.get(this.state, 'itemValue');
    if (!itemValueList) {
      return null;
    }

    return _.map(itemValueList, (data, index) =>
      this.renderText(labelExp ? executeDetailExp(labelExp, data) : _.get(data, 'name', ''), index),
    );
  };

  renderText = (label, index) => {
    if (!label) return null;
    return (
      <View style={styles.option} key={`selectFiled-${index}`}>
        <Text>{label}</Text>
      </View>
    );
  };

  renderFieldData = (fieldData) => {
    const noOptions = _.isEmpty(this.desOptions);
    const renderFiled = _.map(fieldData, (data, index) => {
      //* 有options取其中value，没有则直接渲染
      if (noOptions) return this.renderText(data, index);

      const optionData = _.find(this.desOptions, (e) => data === _.get(e, 'value'));
      return this.renderText(_.get(optionData, 'label', data), index);
    });

    return renderFiled;
  };

  checkTip = () => {
    const { fieldLayout } = this.props;
    const _hint = _.get(fieldLayout, 'tip.hint', '');
    if (_hint && _.isString(_hint)) {
      return _hint;
    }
    return false;
  };

  render() {
    const { title, fieldData, fieldObjectDesc } = this.props;
    const { showTipContent } = this.state;
    const _key = `wrap-${_.get(fieldObjectDesc, 'id') || _.get(fieldObjectDesc, 'api_name')}|| ''`;
    const _tip = this.checkTip();
    const _tipKey = `tip-${_.get(fieldObjectDesc, 'id') ||
      _.get(fieldObjectDesc, 'api_name')}|| ''`;

    return (
      <View key={_key} style={{ backgroundColor: 'white' }}>
        <ListItem style={{ borderColor: '#fff' }}>
          <React.Fragment>
            <Left style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 13, color: '#666666', fontFamily: 'PingFangSC-Regular' }}>
                {title || ''}
              </Text>
              {_tip ? (
                <TipIcon
                  onPress={() => {
                    this.setState({ showTipContent: !showTipContent });
                  }}
                />
              ) : null}
            </Left>
            <Body style={{ flex: 2 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                {this.fieldDataSourde ? this.renderItems() : this.renderFieldData(fieldData)}
              </View>
            </Body>
          </React.Fragment>
        </ListItem>
        {showTipContent ? <TipContent text={_tip} key={_tipKey} /> : null}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  option: {
    backgroundColor: '#e5e5e5',
    paddingHorizontal: 3,
    paddingVertical: 2,
    marginRight: 2,
    marginBottom: 2,
    borderRadius: 2,
  },
});
