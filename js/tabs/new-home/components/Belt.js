/**
 * @flow
 */
import React, { Component } from 'react';
import { StyleSheet, Text, View, Image, Linking } from 'react-native';
import _ from 'lodash';
import img_arr from '../helper/imageHelper';
import { CustomTouch } from '../../../lib/androidWebview';
import { switchDrawer, getDrawerName, isDrawerNameAvaliable } from '../../../utils/routeUtil';
import { toastError } from '../../../utils/toast';
import theme from '../../../utils/theme';
import IcomoonIcon from '../../../lib/IcomoonIcon';

const LINE_COUNT = 4;
type Props = {
  data: Array<Object>,
  parentParam: {
    navigation: Object,
  },
};
export default class extends Component<Props> {
  pressTab = (item: Object) => {
    const {
      parentParam: { navigation },
    } = this.props;
    const { api_name, critirias = [], src, params, display_name, type } = item;
    let record_type = 'master';

    // 效果是找到最后一个符合条件的并取值
    for (let i = critirias.length - 1; i >= 0; i--) {
      if (critirias[i].field === 'record_type' && !_.isEmpty(critirias[i].value)) {
        record_type = critirias[i].value[0];
        break;
      }
    }

    try {
      if (api_name === 'webview') {
        if (type && type === 'external') {
          const url = `${src}${params}`.replace('{{token}}', FC_CRM_TOKEN);
          Linking.canOpenURL(url).then((support) => {
            if (!support) {
              console.warn("Can't handle url: " + url);
            } else {
              return Linking.openURL(url);
            }
          });
        } else {
          navigation.navigate('WebView', {
            navParam: {
              external_page_src: `${src}`,
              external_page_param: params || [],
              label: `${display_name}`,
              showBack: true,
            },
          });
        }
      } else {
        const drawerName = getDrawerName(api_name, record_type);
        if (isDrawerNameAvaliable(drawerName)) {
          switchDrawer(navigation, drawerName, {
            navParam: {
              objectApiName: api_name,
              record_type,
            },
          });
        } else {
          // 这里跳转带有抽屉入口的页面, 会导致路由重叠，这是一个产品交互的问题
          navigation.navigate('Index', {
            navParam: {
              objectApiName: api_name,
              record_type,
              showBack: true,
            },
          });
        }
      }
    } catch (err) {
      toastError(err.message);
    }
  };

  renderIcon(index: number, data: Object) {
    const belt_icon_key = _.get(data, 'belt_icon.key');
    let concrete = null;
    if (belt_icon_key) {
      const belt_icon_style = _.get(data, 'belt_icon.style');
      const bgColorFromLayout = _.get(belt_icon_style, 'backgroundColor', 'black');
      const bgColorStyle = { backgroundColor: bgColorFromLayout };

      const belt_icon_style_without_bgcolor = _.clone(belt_icon_style);
      delete belt_icon_style_without_bgcolor.backgroundColor;

      concrete = (
        <View style={[styles.wh44, styles.borderRadius22, styles.center, bgColorStyle]}>
          <IcomoonIcon
            name={belt_icon_key}
            style={[styles.fontSize22, styles.colorWhite, belt_icon_style_without_bgcolor]}
          />
        </View>
      );
    } else {
      concrete = <Image source={img_arr['image' + (index % 4)]} style={styles.wh44} />;
    }
    return <View style={styles.iconWrapper}>{concrete}</View>;
  }

  render() {
    const { data } = this.props;
    const isInLastLine = (lineCount, total, index) => {
      const lastLineCount = total % lineCount || lineCount;
      return index > total - lastLineCount - 1;
    };

    return data.length > 0 ? (
      <View style={styles.container}>
        {_.map(data, (item, index) => (
          <CustomTouch
            key={`belt${index}`}
            style={[
              styles.beltItem,
              { marginBottom: isInLastLine(LINE_COUNT, data.length, index) ? 0 : 25 },
            ]}
            onPress={() => this.pressTab(item)}
          >
            {this.renderIcon(index, item)}
            <Text style={styles.beltName}>{_.get(item, 'display_name', '')}</Text>
          </CustomTouch>
        ))}
      </View>
    ) : (
      <View />
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    backgroundColor: 'white',
    paddingVertical: 10,
  },
  beltItem: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignContent: 'center',
    alignItems: 'center',
    width: `${100 / LINE_COUNT}%`,
  },
  iconWrapper: {
    marginBottom: 7,
  },
  wh44: {
    width: 44,
    height: 44,
  },
  borderRadius22: {
    borderRadius: 22,
  },
  fontSize22: {
    fontSize: 22,
  },
  colorWhite: {
    color: 'white',
  },
  beltName: {
    fontSize: theme.baseFontSize,
    color: theme.baseFontColor,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
