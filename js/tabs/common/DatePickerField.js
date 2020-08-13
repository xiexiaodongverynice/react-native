/**
 * Created by Uncle Charlie, 2018/02/24
 * @flow
 */

import React from 'react';
import moment from 'moment';
import _ from 'lodash';
import { View, Text, TouchableOpacity } from 'react-native';
import { Icon } from 'native-base';
import DatePicker from '../../lib/date-picker';
import I18n from '../../i18n';
import themes from '../common/theme';

type Prop = {
  onChange: (value: any) => void,
  handleValueChange: (field: string, value: any) => void,
  field: any,
  fieldData: any,
  disabled: boolean,
  minDateValue: any,
  maxDateValue: any,
  validateFail: boolean,
};

const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';

const getFieldNameFromProps = (props) => {
  const { field } = props;
  return _.get(field, 'field');
};

export default class DatePickerField extends React.Component<Prop, {}> {
  componentWillReceiveProps(nextProps) {
    const { fieldData: nextfieldData } = nextProps;
    const { onChange, fieldData } = this.props;
    if (nextfieldData !== fieldData) {
      onChange(nextfieldData);
    }
  }

  getTimestamp = (value) => {
    const index = value.indexOf(':');
    const hour = value.substring(0, index);
    const min = value.substring(index + 1);
    const realValue = hour * 60 * 60 * 1000 + min * 60 * 1000;
    return realValue;
  };

  handleChangeDate = (date: any) => {
    const { onChange, handleValueChange } = this.props;
    const fieldName = getFieldNameFromProps(this.props);
    const { field } = this.props;
    const dateFormat = _.get(field, 'date_time_format') || DATE_FORMAT;
    let time = moment(date, dateFormat);
    if (dateFormat.indexOf('HH:mm') == 0) {
      time = date;
    }
    onChange && onChange(time.valueOf());
    handleValueChange(fieldName, time.valueOf());
  };

  render() {
    const {
      disabled,
      field,
      fieldData,
      minDateValue,
      maxDateValue,
      validateFail = false,
    } = this.props;

    const dateFormat = _.get(field, 'date_time_format') || DATE_FORMAT;
    let fieldDateValue;
    if (fieldData) {
      if (_.get(field, 'render_type') === 'time' && !_.isNaN(moment(fieldData).valueOf())) {
        fieldDateValue = moment.utc(fieldData).format(dateFormat);
      } else if (!_.isNaN(moment(fieldData).valueOf())) {
        fieldDateValue = moment(fieldData);
      } else if (fieldData !== null) {
        fieldDateValue = fieldData;
      }
    }
    const currentDatetime = moment(); // NOTE: default value format is UNIX timestamp.
    const minDate = !minDateValue ? moment([1970, 1, 1]) : moment(minDateValue);
    const maxDate = maxDateValue && moment(maxDateValue);
    let mode = dateFormat.indexOf('HH:mm') > 0 ? 'datetime' : 'date';
    if (dateFormat.indexOf('HH:mm') == 0) {
      mode = 'time';
    }
    return (
      <DatePicker
        style={{ flex: 1, width: '100%' }}
        date={fieldDateValue}
        mode={mode}
        placeholder={I18n.t('select_date')}
        showIcon={false}
        format={dateFormat}
        // minDate={minDate}
        maxDate={maxDate}
        validateFail={validateFail}
        disabled={disabled}
        confirmBtnText={I18n.t('common_sure')}
        cancelBtnText={I18n.t('common_cancel')}
        customStyles={{
          dateIcon: {
            position: 'absolute',
            left: 0,
            top: 4,
            marginLeft: 0,
          },
          dateInput: {
            marginLeft: 36,
          },
          btnTextCancel: {
            fontSize: themes.modal_button_font_size,
            height: 20,
            color: themes.color_text_caption,
          },
          btnTextConfirm: {
            fontSize: themes.modal_button_font_size,
            height: 20,
            color: themes.primary_button_fill_tap,
          },
          dateText: {
            color: '#ccc',
          },
        }}
        onDateChange={this.handleChangeDate}
        upProps={this.props}
      />
    );
  }
}
