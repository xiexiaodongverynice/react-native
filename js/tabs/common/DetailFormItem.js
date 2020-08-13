/**
 * Created by Uncle CHarlie, 2018/03/14
 * @flow
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import moment from 'moment/moment';
import _ from 'lodash';
import { BigNumber } from 'bignumber.js';
import { ListItem, Left, Body } from 'native-base';
import SelectMultipleItem from './SelectMultipleItem';
import CoachResultView from './CoachResultView';
import DetailListItem from '../common/DetailListItem';
import StarRating from '../../components/formComponents/StarRating';
import I18n from '../../i18n';
import PhotoForm from '../../components/formComponents/photo/PhotoForm';
import VideoForm from '../../components/formComponents/video/VideoForm';
import AttachmentItem from '../../components/formComponents/attachment/AttachmentItem';

type Prop = {
  token: string,
  parentData: any,
  fieldData: any,
  navigation: any,
  fromExtender: string,
  pageType: string,
  objectApiName: string,
  fieldApiName: string,
  fieldDesc: any,
  fieldLayout: any,
  callExtenderRefresh: boolean, //* 用于回调刷新页面数据
};

type State = {};

export default class DetailFormItem extends React.PureComponent<Prop, State> {
  timeToStr = (timestamp) => {
    if (!timestamp) return;
    return moment.utc(timestamp).format('HH:mm');
  };

  renderItem = () => {
    const {
      token,
      parentData: basicInfo,
      fieldData,
      objectApiName,
      fieldApiName,
      fieldDesc: fieldObjectDesc,
      fieldLayout: field,
      pageType,
      navigation,
      parentData,
      callExtenderRefresh,
      fromExtender,
    } = this.props;
    /**
     * 判断字段是否显示
     */
    const hiddenWhen = _.get(field, 'hidden_when');
    let needDisplay = true;

    if (_.startsWith(pageType, 'detail')) {
      if (_.indexOf(hiddenWhen, 'detail') >= 0) {
        needDisplay = false;
      }
    }

    if (!needDisplay) {
      return null;
    }

    //* 没有对应的对象字段，布局配置了也不显示
    if (_.isEmpty(fieldObjectDesc)) return null;
    // console.log(field, '=========field=======');
    const renderType = _.get(field, 'render_type');
    const fieldType = _.get(fieldObjectDesc, 'type');
    const label = _.get(fieldObjectDesc, 'label') || fieldObjectDesc || '';
    // 配置 i18n 的字段比较少。
    const title = I18n.t_object_field(objectApiName, fieldObjectDesc.api_name, label);

    const hasParent = _.has(basicInfo, `${fieldApiName}__r`);
    if (renderType === 'date_time' && _.isNumber(fieldData)) {
      const dateFormatter =
        _.get(field, 'date_time_format') ||
        _.get(fieldObjectDesc, 'date_time_format') ||
        _.get(fieldObjectDesc, 'date_format');
      return (
        <DetailListItem
          title={title}
          data={moment(fieldData).format(dateFormatter)}
          desc={fieldObjectDesc}
          field={field}
        />
      );
    } else if (fieldType === 'percentage') {
      let realData = '';
      if (fieldData && !_.isNaN(parseFloat(fieldData))) {
        const x = new BigNumber(parseFloat(fieldData));
        realData = `${x.multipliedBy(100).toNumber()}%`;
      }
      return <DetailListItem title={title} data={realData} desc={fieldObjectDesc} />;
    } else if (renderType === 'inner_html') {
      return (
        <DetailListItem
          title={title}
          data={fieldData}
          desc={fieldObjectDesc}
          field={field}
          navigation={navigation}
          renderType="inner_html"
        />
      );
    } else if (renderType === 'time') {
      const data = this.timeToStr(fieldData);
      return <DetailListItem title={title} data={data} desc={fieldObjectDesc} field={field} />;
    } else if (renderType === 'radio') {
      let options = _.get(fieldObjectDesc, 'options');
      let data = fieldData;
      if (fieldType === 'boolean') {
        if (_.isEmpty(options)) {
          options = [
            {
              label: I18n.t('common_true'),
              value: 'true',
            },
            {
              label: I18n.t('common_false'),
              value: 'false',
            },
          ];
          _.set(fieldObjectDesc, 'options', options);
        }

        const matchedOption = _.find(options, { value: _.toString(fieldData) });
        if (matchedOption) {
          data = matchedOption.label;
        }
      }

      return <DetailListItem title={title} desc={fieldObjectDesc} data={data} field={field} />;
    } else if (renderType === 'boolean') {
      let options = _.get(fieldObjectDesc, 'options');
      if (_.isEmpty(options)) {
        options = [
          {
            label: I18n.t('common_true'),
            value: true,
          },
          {
            label: I18n.t('common_false'),
            value: false,
          },
        ];
      }
      let option = _.find(options, { value: fieldData });
      if (!option) {
        option = {
          label: fieldData,
          value: fieldData,
        };
      }
      return (
        <DetailListItem
          titile={title}
          data={_.get(option, 'label')}
          desc={fieldObjectDesc}
          field={field}
        />
      );
    } else if (hasParent) {
      // * 当数据源来自 RelatedDetailFormItem 扩展并需要从__r或relation中取label显示时
      // * 已提前在 RelatedDetailFormItem 扩展中获取到具体数据
      const value =
        fromExtender === 'RelatedDetailFormItem'
          ? fieldData
          : _.get(basicInfo, `${fieldApiName}__r.name`) ||
            _.get(basicInfo, `${fieldApiName}__r.label`) ||
            fieldData;

      return (
        <DetailListItem
          title={title}
          data={value}
          desc={fieldObjectDesc}
          field={field}
          navigation={navigation}
          hasParent={hasParent}
          parentData={_.get(basicInfo, `${fieldApiName}__r`)}
        />
      );
    } else if (renderType === 'select_one') {
      if ((fieldData || _.isArray(fieldData)) && !field.data_source) {
        return (
          <DetailListItem title={title} desc={fieldObjectDesc} data={fieldData} field={field} />
        );
      }

      return (
        <SelectMultipleItem
          token={token}
          title={title}
          fieldLayout={field}
          fieldData={fieldData}
          fieldObjectDesc={fieldObjectDesc}
          renderType="select_one"
          callExtenderRefresh={callExtenderRefresh}
        />
      );
    } else if (renderType === 'star') {
      return (
        <StarRating
          pageType="detail"
          title={title}
          desc={fieldObjectDesc}
          data={fieldData}
          field={field}
          maxStars={5}
          rating={fieldData}
          disabled
          starSize={20}
        />
      );
    } else if (renderType === 'select_multiple') {
      if (!fieldData) {
        return (
          <DetailListItem title={title} desc={fieldObjectDesc} data={fieldData} field={field} />
        );
      }

      return (
        <SelectMultipleItem
          token={token}
          title={title}
          fieldLayout={field}
          fieldData={fieldData}
          fieldObjectDesc={fieldObjectDesc}
          renderType="select_multiple"
          callExtenderRefresh={callExtenderRefresh}
        />
      );
    } else if (renderType === 'long_text') {
      return (
        <DetailListItem
          title={title}
          data={fieldData}
          desc={fieldObjectDesc}
          field={field}
          renderType="long_text"
        />
      );
    } else if (renderType === 'money') {
      const { symbol = '' } = field; //不配置"symbol"时不显示货币符号，配置后才显示
      const resultData = _.isUndefined(fieldData)
        ? ''
        : symbol + `${fieldData}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

      return (
        <DetailListItem title={title} data={resultData} desc={fieldObjectDesc} field={field} />
      );
    } else if (renderType === 'json_table') {
      return (
        <ListItem style={{ borderBottomWidth: 0 }}>
          <CoachResultView result={fieldData} />
        </ListItem>
      );
    } else if (fieldType === 'attachment' && renderType === 'video') {
      return (
        <VideoForm
          key={title}
          title={title}
          navigation={navigation}
          parentRecord={parentData}
          pageType={pageType}
          objectApiName={objectApiName}
          extenderName={fieldApiName}
          formItemRequired={false}
          field={field}
          fieldDesc={fieldObjectDesc}
        />
      );
    } else if (renderType === 'image_upload' || fieldType === 'image') {
      return (
        <PhotoForm
          title={title}
          token={token}
          navigation={navigation}
          parentRecord={parentData}
          pageType={pageType}
          objectApiName={objectApiName || fieldApiName}
          fieldDesc={fieldObjectDesc}
          extenderName={fieldApiName}
          formItemRequired={false}
          field={field}
        />
      );
    } else if (renderType === 'attachment') {
      return (
        <AttachmentItem
          style={{ flex: 1 }}
          token={token}
          pageType={pageType}
          title={title}
          data={fieldData}
          desc={fieldObjectDesc}
          navigation={navigation}
        />
      );
    } else if (renderType === 'url') {
      return (
        <DetailListItem
          title={title}
          data={fieldData}
          desc={fieldObjectDesc}
          field={field}
          renderType={renderType}
          navigation={navigation}
        />
      );
    } else {
      return <DetailListItem title={title} data={fieldData} desc={fieldObjectDesc} field={field} />;
    }
  };

  render() {
    return this.renderItem();
  }
}
