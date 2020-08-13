//@flow
/*eslint-disable*/
import React from 'react';
import { Text, View } from 'react-native';
import IconWhiteCircle from './IconWhiteCircle';
import NameGenderContent from './NameGenderContent';
import TextBlockField from './TextBlockField';
import VerticalSpacer from '../../../components/common/VerticalSpacer';
import _ from 'lodash';
import assert from '../../../utils/assert0';
import IndexDataParser from '../../../services/dataParser';
import * as Util from '../../../utils/util';

function BlueBlock() {
  const style = {
    backgroundColor: '#56A8F7',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 110,
  };
  return <View style={style} />;
}

//内部的圆角矩形，需要有阴影
function InnerRoundRect(props: { children: any }) {
  const shadowStyle = {
    shadowColor: '#DDDDDD',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 3.84,

    elevation: 5,
  };
  const style = {
    borderRadius: 4,
    backgroundColor: 'white',
    paddingTop: 40,
  };
  return <View style={[style, shadowStyle]}>{props.children}</View>;
}

function Vertical1x40() {
  const style1x40 = {
    width: 1,
    height: 40,
    backgroundColor: '#F6F6F6',
  };
  return (
    <View style={styles.center}>
      <View style={style1x40} />
    </View>
  );
}

function getTextBlockFromFields(props: typeProps, leftOrRight: string) {
  assert(leftOrRight === 'left' || leftOrRight === 'right');
  const fields = _.get(props.componentLayout, 'fields', []);
  let layoutFieldInfo: {
    field: string,
    render_type: string,
  } = null;
  if (leftOrRight === 'left') {
    layoutFieldInfo = _.get(fields, '[0]');
  } else {
    layoutFieldInfo = _.get(fields, '[1]');
  }
  assert(_.isString(layoutFieldInfo.field));
  const label = IndexDataParser.parseFieldLabelV2(
    layoutFieldInfo.field,
    props.objectApiName,
    props.currentObjDes,
  );
  const value = IndexDataParser.parseFieldValue(
    props.objectApiName,
    layoutFieldInfo,
    props.detailData,
    props.currentObjDes,
  );
  tron.log('getTextBlockFromFields', label, value);
  return <TextBlockField label={label} content={value} style={styles.flex1} />;
}

function getNameGenderContentFromPaydLayout(props: typeProps) {
  const padLayout = _.get(props.componentLayout, 'padLayout');
  const title_fieldKey = _.get(padLayout, 'title.value');
  const title_type = _.get(padLayout, 'title.type');

  const gender_fieldKey = _.get(padLayout, 'gender.value');

  const contents = _.get(padLayout, 'contents');
  assert(_.isArray(contents));

  let title = '';
  if (title_type === 'text') {
    title = _.get(props.detailData, title_fieldKey);
  }
  const gender = _.get(props.detailData, gender_fieldKey);

  const contents_str = contents.map((elem) => {
    let elem_str = '';
    if (elem.type === 'text') {
      elem_str = _.get(props.detailData, elem.value);
    } else if (elem.type === 'expression') {
      elem_str = Util.executeDetailExp(elem.value, props.detailData, props.currentObjDes, props);
    } else if (elem.type === 'text') {
      elem_str = _.get(props.detailData, elem.value);
    } else {
      elem_str = IndexDataParser.parseFieldValue(
        props.objectApiName,
        elem.value,
        props.detailData,
        props.currentObjDes,
      );
    }
    return elem_str;
  });
  const content_str_result = contents_str.join('');
  return <NameGenderContent name={title} gender={gender} content={content_str_result} />;
}

type typeProps = {
  componentLayout: any, //布局中的一个component
  detailData: any, //布局对应的对象
  objectDescription: any, //整个租户所有的对象定义，*所有的！* 注意：objectDescription经常是有歧义的，可能表示 【所有对象】、可能表示【一个对象】
  objectApiName: string,
  currentObjDes: any, //当前对象的 对象定义
};

export default function DetailFancyHeader(props: typeProps) {
  tron.log('DetailFancyHeader', props);
  const { componentLayout } = props;
  assert(componentLayout.type === 'phone_detail_header', '必须是特定type');

  const icon_color = _.get(componentLayout, 'icon_color', '#ffcc66');
  const icon = _.get(componentLayout, 'icon', 'icon-47');

  return (
    <View style={[styles.backColorWhite, styles.paddingLR10, styles.paddingT40]}>
      <BlueBlock />
      <InnerRoundRect>
        <VerticalSpacer height={5} />
        {getNameGenderContentFromPaydLayout(props)}
        <VerticalSpacer height={15} />
        <View style={styles.flexDirectionRow}>
          {getTextBlockFromFields(props, 'left')}
          <Vertical1x40 />
          {getTextBlockFromFields(props, 'right')}
        </View>
        <VerticalSpacer height={15} />
      </InnerRoundRect>

      <View style={[styles.center, styles.absoluteTop, styles.elevation6]}>
        <IconWhiteCircle icon_color={icon_color} icon={icon} />
      </View>
    </View>
  );
}

const styles = {
  backColorWhite: {
    backgroundColor: 'white',
  },
  paddingLR10: {
    paddingLeft: 10,
    paddingRight: 10,
  },
  paddingT40: {
    paddingTop: 40,
  },
  flexDirectionRow: {
    flexDirection: 'row',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex1: {
    flex: 1,
  },
  absoluteTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  elevation6: {
    //仅安卓有用
    elevation: 6,
  },
};
