/*  eslint-disable */
/**
 * Created by gao
 * @flow
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  DeviceEventEmitter,
} from 'react-native';
import { Left, Right } from 'native-base';
import * as _ from 'lodash';
import themes from '../common/theme';

export default class TimeEventScreen extends React.PureComponent {
  state = {
    events: [],
  };

  eventListener;

  componentDidMount() {
    const { events } = this.props;
    this.eventListener = DeviceEventEmitter.addListener('CreateTemplateDetailEvent', (data) => {
      this.handlerData(data);
    });
    this.delEventListener = DeviceEventEmitter.addListener('DeleteTemplateDetailEvent', (data) => {
      this.handlerData(data, 'delete');
    });
    this.setState({ events });
  }

  componentWillUnmount() {
    if (_.isFunction(_.get(this, 'eventListener.remove'))) {
      this.eventListener.remove();
    }
    if (_.isFunction(_.get(this, 'delEventListener.remove'))) {
      this.delEventListener.remove();
    }
  }

  componentWillReceiveProps(nextProps) {
    const { events } = nextProps;
    this.setState({ events });
  }

  async handlerData(data, flag) {
    const { events } = this.props;
    const reciveEvents = _.cloneDeep(events);
    if (flag === 'delete') {
      reciveEvents.forEach((dt) => {
        if (dt.id == data.id) {
          reciveEvents.splice(reciveEvents.indexOf(dt), 1);
        }
      });
      events.forEach((item) => {
        if (item.id == data.id) {
          events.splice(events.indexOf(item), 1);
        }
      });
    } else {
      reciveEvents.push(data);
      events.push(data);
    }
    this.setState({ events: reciveEvents });
  }

  TimeList = [
    '00:00',
    '01:00',
    '02:00',
    '03:00',
    '04:00',
    '05:00',
    '06:00',
    '07:00',
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
    '19:00',
    '20:00',
    '21:00',
    '22:00',
    '23:00',
    '24:00',
  ];

  renderTimeLine = (events) => {
    const cardList = [];
    const eventList = [];
    if (events.length > 0) {
      _.each(events, (event) => {
        const startTime = event.start_time;
        const endTime = event.end_time;
        const eventHeight = this.getHeight(startTime - endTime);
        eventList.push({
          startTime: event.start_time,
          endTime: event.end_time,
          eventHeight,
          title: event['customer__r'] ? event['customer__r'].name : '',
          sourceData: event,
          id: event && event.id,
        });
      });
    }

    _.each(this.TimeList, (time, index) => {
      const compareTime = this.getTime(time);
      _.each(eventList, (event1) => {
        const eventTop = this.getHeight(event1.startTime - compareTime);
        event1['eventTop'] = eventTop;
      });
      const widthList = [];
      _.each(eventList, (event) => {
        if (event.startTime > compareTime - 1 && event.startTime < compareTime + 3600000) {
          widthList.push(event);
        }
      });

      widthList.forEach((e, index) => {
        e['width'] = 100 / widthList.length + '%';
        e['paddingLeft'] = (index * 100) / widthList.length + '%';
      });

      if (events.length == 0) {
        if (time == '00:00') {
          cardList.push(
            <TouchableOpacity key={this.TimeList[index]} onLongPress={() => this.addEvent(time)}>
              <View style={styles.timeCardList}>
                <View style={styles.timeLine}>
                  <View style={styles.text}>
                    <Text>{time}</Text>
                  </View>
                </View>
                <View style={styles.contentContainer}>
                  <View style={styles.lineStyle} />
                  <View
                    style={{
                      width: '100%',
                      backgroundColor: '#f2f2f2',
                      paddingLeft: 10,
                      paddingTop: 10,
                      paddingBottom: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: 'white',
                    }}
                  >
                    <Text style={{ fontSize: 15, color: 'gray' }}>{'长按空白添加拜访客户'}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>,
          );
        } else {
          cardList.push(
            <TouchableOpacity key={this.TimeList[index]} onLongPress={() => this.addEvent(time)}>
              <View style={styles.timeCardList}>
                <View style={styles.timeLine}>
                  <View style={styles.text}>
                    <Text>{time}</Text>
                  </View>
                </View>
                <View style={styles.contentContainer}>
                  <View style={styles.lineStyle} />
                  {this.renderEvents(eventList)}
                </View>
              </View>
            </TouchableOpacity>,
          );
        }
      } else {
        cardList.push(
          <TouchableOpacity key={this.TimeList[index]} onLongPress={() => this.addEvent(time)}>
            <View style={styles.timeCardList}>
              <View style={styles.timeLine}>
                <View style={styles.text}>
                  <Text>{time}</Text>
                </View>
              </View>
              <View style={styles.contentContainer}>
                <View style={styles.lineStyle} />
                {this.renderEvents(eventList)}
              </View>
            </View>
          </TouchableOpacity>,
        );
      }
    });
    return cardList;
  };

  addEvent = (time) => {
    const timestamp = this.getTime(time);
    const { navigation, parentData, weekDay } = this.props;
    navigation.navigate('Create', {
      navParam: {
        refObjectApiName: 'call_template_detail',
        targetRecordType: 'master',
        parentData,
        parentId: parentData.id,
        parentName: parentData.name,
        needReturn: true,
        timestamp,
        weekDay,
      },
    });
  };

  getTime = (clockTime) => {
    const index = clockTime.indexOf(':');
    const hour = clockTime.substring(0, index);
    const min = clockTime.substring(index + 1);
    const realValue = hour * 60 * 60 * 1000 + min * 60 * 1000;
    return realValue;
  };

  getHeight = (timestamp) => {
    const TotalHeight = 90;
    const minute = timestamp / 60000;
    const height = minute * 1.5;
    return height;
  };

  timeToStr = (timestamp) => {
    const minutes = parseInt(timestamp / 60000);
    let min = minutes % 60;
    let hour = parseInt(minutes / 60);
    if (hour < 10) {
      hour = '0' + hour;
    }
    if (min < 10) {
      min = '0' + min;
    }
    return hour + ':' + min;
  };

  clickItem = (event) => {
    const { navigation } = this.props;
    navigation.navigate('Detail', {
      navParam: {
        id: _.get(event.sourceData, 'id'),
        objectApiName: _.get(event.sourceData, 'object_describe_name'),
        record_type: _.get(event.sourceData, 'record_type'),
      },
    });
  };

  renderEvents = (eventList) => {
    return (
      <View style={styles.enventsListStyle}>
        {_.map(eventList, (event) => {
          return (
            <TouchableOpacity
              style={{
                top: event.eventTop,
                height: event.eventHeight,
                width: event.width ? event.width : '100%',
                backgroundColor: '#DEE3F3',
                borderLeftWidth: 3,
                borderLeftColor: '#303A82',
                paddingLeft: 10,
                paddingTop: 4,
                paddingBottom: 4,
                borderBottomWidth: 1,
                borderBottomColor: 'white',
                left: event.paddingLeft,
                position: 'absolute',
              }}
              onPress={() => this.clickItem(event)}
            >
              <View>
                <Text style={{ fontSize: 12 }}>{this.timeToStr(event.startTime)}</Text>
                <Text style={{ fontSize: 15 }}>{event.title}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  render() {
    const { events } = this.state;
    return (
      <View style={styles.container}>
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
            <Text>{`${events.length}个拜访`}</Text>
          </Left>
          <Right />
        </View>
        <ScrollView>{() => this.renderTimeLine(events)}</ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'white',
    height: 800,
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  capture: {
    flex: 0,
    fontSize: 70,
    color: '#fff',
    alignSelf: 'center',
    margin: 5,
  },
  timeLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lineStyle: {
    height: 1,
    backgroundColor: '#ccc',
    width: '100%',
  },
  text: {
    color: '#ccc',
    fontSize: 30,
    width: 60,
    paddingLeft: 10,
  },
  timeCardList: {
    height: 90,
    position: 'relative',
  },
  enventsListStyle: {
    position: 'relative',
    width: '100%',
  },
  contentContainer: {
    paddingLeft: 60,
    position: 'absolute',
    width: '100%',
  },
  innerTextStyle: {
    width: '100%',
    backgroundColor: '#DEE3F3',
    borderLeftWidth: 3,
    borderLeftColor: '#303A82',
    paddingLeft: 10,
    paddingTop: 4,
    paddingBottom: 4,
    fontSize: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'white',
    position: 'absolute',
  },
});
