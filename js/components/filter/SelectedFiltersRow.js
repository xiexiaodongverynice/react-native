/* eslint-disable */
//@flow
// 高度固定的row，展示已选择的筛选条件（filterObjs），可以左右滑动
import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Text, View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import assert from '../../utils/assert0';
import HorizontalSpacer from '../common/HorizontalSpacer';

const RowHeight = 29;
const LabelHeight = 21;
const CellHeight = 29; //cell上下空白4

//圆角矩形Label，显示【医保药店: 是】
function RoundRectLabel(props: { text: string }) {
  assert(_.isString(props.text), '只接受1个props，即text');

  const containerStyle = {
    backgroundColor: '#f6f6f6',
    height: LabelHeight,
    borderRadius: LabelHeight * 0.5,
    paddingLeft: LabelHeight * 0.5,
    paddingRight: LabelHeight * 0.5,
  };

  const textStyle = {
    fontSize: 12,
    color: '#999999',
  };
  return (
    <View style={[containerStyle, styles.center]}>
      <Text style={textStyle}>{props.text}</Text>
    </View>
  );
}

function Cell(props) {
  assert(_.isObject(props.filterObj), '必须传入filterObj');
  const filterObj = props.filterObj;
  assert(_.isString(filterObj.displayName));
  assert(_.isString(filterObj.displayValue), 'displayValue是用户输入的值，必须为string');
  const { displayName, displayValue } = filterObj;

  const heightStyle = {
    height: CellHeight,
  };
  const text = `${displayName}：${displayValue}`;
  const elem = (
    <View style={[styles.center, heightStyle]}>
      <RoundRectLabel text={text} />
    </View>
  );
  const supportClick = _.isFunction(props.onPress);
  if (supportClick) {
    const onPress = () => {
      if (_.isFunction(props.onPress)) {
        props.onPress(props); //将props作为参数传到handler中
      }
    };
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.5}>
        {elem}
      </TouchableOpacity>
    );
  } else {
    return elem;
  }
}

export class FilterObj {
  constructor(displayName: string, displayValue: string, underlaying: any) {
    assert(displayValue.length > 0, 'need displayValue.length>0');
    this.displayName = displayName;
    this.displayValue = displayValue;
    this.underlaying = underlaying; //任意底层数据
  }
}

export class SelectedFiltersRow extends React.Component {
  static propTypes = {
    style: PropTypes.object,
    onPress: PropTypes.func, //不传递onPress则不支持 按压变alpha
    filterObjs: PropTypes.array.isRequired,
  };

  //每个filters都生成一个Cell
  renderCells() {
    const cells = [];
    const filters = this.props.filterObjs;
    filters.forEach((filterObj) => {
      cells.push(<HorizontalSpacer width={12} />); //每个cell左边都有12的空白
      const cell = <Cell onPress={this.props.onPress} filterObj={filterObj} />;
      cells.push(cell);
    });
    return cells;
  }

  render() {
    //  每个Filter元素，都有fieldName和filterValue
    assert(_.isArray(this.props.filterObjs), 'filterObjs是用户已选择的过滤条件');

    const containerStyle = {
      height: RowHeight,
      width: '100%',
    };
    return (
      <View style={[containerStyle, styles.backgroundColorWhite, this.props.style]}>
        <ScrollView
          style={styles.flex1}
          horizontal
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          <HorizontalSpacer width={3} />
          {this.renderCells()}
          <HorizontalSpacer width={15} />
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  border1: {
    borderWidth: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundColorWhite: {
    backgroundColor: 'white',
  },
});

if (__DEV__) {
  //__DEV__既是runtime变量、也是bundling time变量。所以并不会被打包进production bundle
  class SelectedFiltersRowTest extends React.Component {
    render() {
      const filterObjs = [
        new FilterObj('aaa', 'bbb', null),
        new FilterObj('aaa00', 'bb4b', null),
        new FilterObj('aaa11', 'bb4b', null),
        new FilterObj('aaa22', 'bb5b', null),
        new FilterObj('aaa33', 'bb5b', null),
        new FilterObj('aaa44', 'bb55b', null),
        new FilterObj('aaa55', 'bbb55', null),
      ];
      return <SelectedFiltersRow filterObjs={filterObjs} />;
    }
  }
  exports.SelectedFiltersRowTest = SelectedFiltersRowTest;
}
