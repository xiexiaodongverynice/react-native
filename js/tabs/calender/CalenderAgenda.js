import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { queryMultipleRecordList, createCriteria } from '../../actions/query';
import { Agenda } from 'react-native-calendars';
import { LocaleConfig } from 'react-native-calendars';
import * as _ from 'lodash';
import moment from 'moment';
import I18n from '../../i18n';
import themes from '../common/theme';

class CalenderAgenda extends Component<Prop, State> {
  constructor(props) {
    super(props);
    // * 设置日历item_content宽度
    this.itemContentWidth = (themes.deviceWidth - 93) * 0.65;

    this.state = {
      items: this.props.items,
      selected: this.props.timeStr,
    };
  }

  componentWillMount() {
    const lang = I18n.t('lang');
    LocaleConfig.locales['lang'] = lang;
    LocaleConfig.defaultLocale = 'lang';
  }

  dayHavePressed(e) {
    this.props.onDaySelected(e);
  }

  render() {
    const today = _.now();
    const timeStr = moment.unix(today / 1000).format('YYYY-MM-DD');
    const { items, selected } = this.state;
    return (
      <Agenda
        items={items}
        selected={timeStr}
        renderItem={this.renderItem.bind(this)}
        renderEmptyData={() => <View />}
        rowHasChanged={this.rowHasChanged.bind(this)}
        onDayPress={this.dayHavePressed.bind(this)}
      />
    );
  }

  componentWillReceiveProps(nextProps) {
    const { items, selected } = nextProps;
    this.setState({ items, selected });
  }

  clickItem(item) {
    const { handleNav } = this.props;
    handleNav('Detail', {
      navParam: this.createNavParam(item.data),
    });
  }

  createNavParam = (item: any) => ({
    id: _.get(item, 'id'),
    objectApiName: _.get(item, 'object_describe_name'),
    record_type: _.get(item, 'record_type'),
    from: 'CalenderPage',
  });

  renderItem(item) {
    return (
      <TouchableOpacity onPress={this.clickItem.bind(this, item)}>
        <View style={[styles.item, { height: item.height }]}>
          <View>
            <Text style={{ fontWeight: 'bold', fontSize: 12, paddingBottom: 12 }}>{item.hour}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: this.itemContentWidth }}>
              <Text style={{ fontSize: 16 }} numberOfLines={3}>
                {item.name}
              </Text>
            </View>
          </View>
          {item.label ? (
            <View
              style={{
                backgroundColor: `${item.label.bgColor}`,
                borderColor: `${item.label.borderColor}`,
                borderStyle: 'solid',
                padding: 5,
                borderRadius: 5,
                borderWidth: 1,
              }}
            >
              <Text style={{ color: `${item.label.textColor}` }}>{item.label.name}</Text>
            </View>
          ) : (
            ''
          )}
        </View>
      </TouchableOpacity>
    );
  }

  rowHasChanged(r1, r2) {
    return r1.name !== r2.name;
  }

  timeToString(time) {
    const date = new Date(time);
    return date.toISOString().split('T')[0];
  }
}

const select = (state) => ({
  token: state.settings.token,
  objectDescription: state.settings.objectDescription,
  permission: state.settings.permission,
});

const act = (dispatch) => ({
  actions: bindActionCreators({ queryMultipleRecordList }, dispatch),
  dispatch,
});

export default connect(select, act)(CalenderAgenda);

const styles = StyleSheet.create({
  item: {
    backgroundColor: 'white',
    flex: 1,
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    marginTop: 17,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
