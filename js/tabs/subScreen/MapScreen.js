/**
 * Created by Uncle Charlie, 2018/04/13
 * @flow
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TouchableHighlight,
  FlatList,
  Platform,
} from 'react-native';
import { Icon, Body, Right, Title, Button } from 'native-base';
import _ from 'lodash';
import moment from 'moment';
import { connect } from 'react-redux';
import { MapView, MapTypes, Geolocation, Overlay } from 'react-native-baidu-map';
import { HeaderLeft, StyledContainer, StyledHeader, CustomerConfirm } from '../common/components';
import themes from '../common/theme';
import LoadingScreen from '../common/LoadingScreen';
import { baidumap, app_version } from '../../utils/config';
import request from '../../utils/request';
import { TENANT_ID_COLLECT } from '../../utils/const';
import * as locationHelper from '../common/helpers/locationHelper';
import { toastWaring, toastError } from '../../utils/toast';
import * as Utils from '../../utils/util';
import { getServerTime } from '../../services/settings';
import { Throttle } from '../common/helpers/naviagteHelper';
import Linking from '../../utils/Linking';
import commonStyles from '../common/screenStyle';
import AndroidPermissions from '../../utils/AndroidPermissions';
import I18n from '../../i18n';
import { checkLocationDistance } from '../common/helpers/utils';
import assert from '../../utils/assert0';
import OutofRangeAlert from '../../lib/RNMWrapper/OutofRangeAlert';
import RNBugly from '../../utils/RNBugly';

const { width: ScreenWidth, height: ScreenHeight } = Dimensions.get('window');
const GET_RADIUS = baidumap.getradius;
const WATERMARK_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

//如果传入的坐标不合格，返回null
function makeLatLgtd(latitudeWeaktype, longitudeWeaktype) {
  const latitude = _.toNumber(latitudeWeaktype);
  const longitude = _.toNumber(longitudeWeaktype);
  if (Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) {
    return { latitude, longitude };
  } else {
    return null;
  }
}

type Prop = {
  navigation: {
    goBack: () => void,
    navigate: (screen: string) => void,
    state: {
      params: {
        latitude: number,
        longitude: number,
        type: 'sign' | 'lookup',
        sign_type: 'sign_in' | 'otherAnything', //其他值都作为sign_out
        validLocation: any,
        pageSize: any,
        callback: (geoData: any) => void,
        gotoPage: string,
        pageType: string,
        key: string,
        fieldDesc: any,
        parentData: any,
      },
    },
  },
  dispatch: any,
  screen: string,
  onComponentDidMount: any,
  onComponentUnMount: any,
  crmPowerSetting: any,
  userInfo: any,
};

type State = {
  processStatus: 'pengding' | 'done',
  mapType: number,
  zoom: number,
  trafficEnabled: boolean,
  baiduHeatMapEnabled: boolean,
  center: {
    longitude: number,
    latitude: number,
  },
  poiList: any[],
  selectedUid: ?string,
};

class MapScreen extends React.PureComponent<Prop, State> {
  constructor(props) {
    super(props);
    this.initialState = {
      processStatus: 'pengding',
      mapType: MapTypes.NORMAL,
      zoom: 19,
      trafficEnabled: false,
      baiduHeatMapEnabled: false,
      center: {},
      poiList: [],
      selectedUid: '',
    };
    this.state = _.clone(this.initialState);

    const {
      navigation: {
        state: { params },
      },
    } = this.props;
    const { latitude, longitude, type } = params;
    this.isLookUp = type === 'lookup' && latitude && longitude;
  }

  async componentDidMount() {
    let location;
    const {
      onComponentDidMount,
      navigation: {
        state: { params },
      },
    } = this.props;

    if (_.isFunction(onComponentDidMount)) {
      onComponentDidMount(this.refresh);
    }

    const {
      type = 'sign', //默认navigation.params.type为签到、签出，到底是签到还是签出并没有传过来
      latitude = '',
      longitude = '',
      pageSize = 10,
      validLocation = true,
    } = params;
    this.type = type; // *区分签到和查看地图组件
    this.pageSize = pageSize;
    this.validLocation = validLocation;

    try {
      await AndroidPermissions.Location();
    } catch (err) {
      toastError(err.message);
    }

    if (this.type === 'lookup' && latitude && longitude) {
      location = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      };
      this.setState((prevState) => ({
        center: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        processStatus: 'done',
      }));
    } else {
      await this.getCurrentPosition();
    }
  }

  static async getCurrentPosition_platform_conditioned(funcToRunOnceAuthStatusChange) {
    if (Platform.OS === 'android') {
      const result = await Geolocation.getCurrentPosition();
      return result;
    } else {
      const result = await MapScreen.getCurrentPosition_ios(funcToRunOnceAuthStatusChange);
      return result;
    }
  }

  static async getCurrentPosition_ios(funcToRunOnceAuthStatusChange) {
    const statusName = await Geolocation.getIOSAuthorizationStatus();
    if (statusName === 'Denied') {
      // alert('您已拒绝定位。请手动打开定位权限后重试'); //目前 在CustomerConfirm处会提示，以后可以优化提示
      return null;
    } else if (statusName === 'Restricted') {
      // alert('似乎您没有打开定位功能');  //目前 在CustomerConfirm处会提示，以后可以优化提示
      return null;
    } else if (statusName === 'WhenInUse' || statusName === 'Always') {
      const result = await Geolocation.getCurrentPosition();
      return result;
    } else if (statusName === 'NotDetermined') {
      Geolocation.onceAuthStatusChange(funcToRunOnceAuthStatusChange);
      Geolocation.requestWhenInUseAuthorization();
      return 'waitUserChoose';
    } else {
      //alert('somethingWrong');  //目前 在CustomerConfirm处会提示，以后可以优化提示
      return null;
    }
  }

  funcToRunOnceAuthStatusChange = () => {
    this.getCurrentPosition(); //不需要返回值
  };

  getCurrentPosition = async () => {
    let location;

    try {
      location = await MapScreen.getCurrentPosition_platform_conditioned(
        this.funcToRunOnceAuthStatusChange,
      );
      if (location === 'waitUserChoose') {
        return;
      }
      if (this.validLocation && !Utils.checkLocationExact(location)) {
        throw Error('getCurrentPosition error');
      }

      const query = `location=${location.latitude},${location.longitude}`;
      const url = GET_RADIUS.replace('query', query);
      const reversedCode = await request(url);

      if (_.isEmpty(reversedCode)) {
        throw Error('get location info error');
      }

      this.setState((prevState) => ({
        center: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        processStatus: 'done',
        poiList: _.get(reversedCode, 'result.pois', []).slice(0, this.pageSize),
      }));
    } catch (e) {
      console.log('[error] mapScreen getCurrentPosition error', e);
      //   Linking.openURL('app-settings:');

      CustomerConfirm({
        title: I18n.t('MapScreen.Title.LocationPrivilege'),
        onCancelObj: {
          tip: I18n.t('common_cancel'),
          handle: () => {},
        },
        onOKObj: {
          tip: I18n.t('MapScreen.Btn.Retry'),
          handle: this.getCurrentPosition,
        },
      });
    }
  };

  componentWillUnmount() {
    const { onComponentUnMount } = this.props;
    if (_.isFunction(onComponentUnMount)) {
      onComponentUnMount();
    }
  }

  //不知有啥用，先留着
  handleLocate = async () => {
    const location = await MapScreen.getCurrentPosition_platform_conditioned();
    this.setState((prevState) => ({
      center: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
    }));
  };

  handlePress = (uid: string) => {
    if (!uid || uid === this.state.selectedUid) {
      return;
    }
    this.setState((prevState) => ({
      selectedUid: uid,
    }));
  };

  openDeviceMap = () => {
    const {
      state: {
        params: { latitude, longitude },
      },
    } = this.props.navigation;
    Linking.openUrlWithCheck(Utils.getDirectionUrl(latitude, longitude)).catch(() => {
      toastError(I18n.t('MapScreen.PleaseInstallBaiduMap'));
    });
  };

  static getExtra(hardwareLat, hardwareLgtd, customerLat, customerLgtd, poiLat, poiLgtd): string {
    const customerLocation = makeLatLgtd(customerLat, customerLgtd);
    const hardwareLocation = makeLatLgtd(hardwareLat, hardwareLgtd);
    const poiLocation = makeLatLgtd(poiLat, poiLgtd);

    const { sign_in_range = null, out_of_range = null } = global.CRM_SETTINGS;

    let hardwareDistance = null;
    let poiDistance = null;
    if (customerLat && customerLgtd) {
      hardwareDistance = checkLocationDistance(hardwareLocation, customerLocation);
      poiDistance = checkLocationDistance(poiLocation, customerLocation);
    }

    const timestamp = Date.now();
    const OS = Platform.OS;
    const extra = {
      hardwareLat,
      hardwareLgtd,
      customerLat,
      customerLgtd,
      poiLat,
      poiLgtd,
      sign_in_range,
      out_of_range,
      hardwareDistance,
      poiDistance,
      timestamp,
      OS,
      app_version,
    };
    return JSON.stringify(extra);
  }

  selectDone = async () => {
    const { navigation } = this.props;
    const { selectedUid, poiList, processStatus } = this.state;
    if (processStatus != 'done') {
      return;
    }

    let serverTime = moment().valueOf();
    let selectedPoi = _.find(poiList, (item) => item.uid === selectedUid);
    if (_.isEmpty(selectedPoi)) {
      selectedPoi = _.get(poiList, '[0]');
    }

    try {
      const serverTimeData = await getServerTime();
      if (!_.isEmpty(serverTimeData) && _.get(serverTimeData, 'result')) {
        serverTime = _.get(serverTimeData, 'result');
      }
    } catch (e) {
      console.log('[error] get server time error');
    }

    const poiLat = _.get(selectedPoi, 'point.y');
    const poiLgtd = _.get(selectedPoi, 'point.x');

    if (!_.isNumber(serverTime) || _.isNaN(serverTime)) {
      toastWaring(I18n.t('MapScreen.TimeoutServerTimeFail'));
      return;
    }

    if (!_.isNumber(poiLat) || !_.isNumber(poiLgtd) || _.isNaN(poiLat) || _.isNaN(poiLgtd)) {
      toastWaring(I18n.t('MapScreen.TimeoutLocationFail'));
      return;
    }

    const hardwareLat = this.state.center.latitude;
    const hardwareLgtd = this.state.center.longitude;
    const parentData = _.get(navigation, 'state.params.parentData', {});
    const customerLat = _.get(parentData, 'customer__r.latitude');
    const customerLgtd = _.get(parentData, 'customer__r.longitude');

    const selectedRecord = {
      address: _.get(selectedPoi, 'addr'),
      name: _.get(selectedPoi, 'name'),
      latitude: poiLat ? poiLat.toFixed(5) : '',
      longitude: poiLgtd ? poiLgtd.toFixed(5) : '',
      uid: _.get(selectedPoi, 'uid'),
      time: serverTime,
      extra: MapScreen.getExtra(
        hardwareLat,
        hardwareLgtd,
        customerLat,
        customerLgtd,
        poiLat,
        poiLgtd,
      ),
    };

    const signInJump = (navigation, selectedRecord) => {
      const callback = _.get(navigation, 'state.params.callback');
      const gotoPage = _.get(navigation, 'state.params.gotoPage');
      const pageType = _.get(navigation, 'state.params.pageType', 'add');
      const screenKey = _.get(navigation, 'state.key');
      const fieldDesc = _.get(navigation, 'state.params.fieldDesc', {});
      if (!gotoPage) {
        callback && callback(selectedRecord);
        navigation.goBack();
      } else {
        navigation.navigate('Photo', {
          pageType,
          photoList: [],
          callback: callback(selectedRecord, screenKey),
          fromSource: 'sign',
          watermarkInfo: this.getWatermarkInfo(selectedRecord),
          fieldDesc,
        });
      }
    };

    const f_getOutRangeAlertElem = (deviation: number, sign_in_range: number) => {
      //sign_in_range，允许的签到范围
      const buttonTitle = this.getRightButtonTitle();
      const customerName = this.getCustomerName();
      const selectedRecordLLStr = `${poiLgtd.toFixed(5)},${poiLat.toFixed(5)}`;
      const customerLoc = this.getCustomerLoc();
      const customerLLStr = `${customerLoc.longitude.toFixed(5)},${customerLoc.latitude.toFixed(
        5,
      )}`;
      const poiName = selectedRecord.name;
      const title = '超出签到范围';
      const subTitle = `当前定位超出有效签到范围，将标记为异常，是否仍要${buttonTitle}？`;
      const moreText = `提示：当前距离"${customerName}"为${deviation.toFixed(
        0,
      )}米。选中点(${poiName})的经纬度为${selectedRecordLLStr}，拜访点的经纬度为${customerLLStr}。`;

      const alertElem = (
        <OutofRangeAlert
          onOkBtnPress={() => {
            signInJump(navigation, selectedRecord);
          }}
          title={title}
          subTitle={subTitle}
          moreText={moreText}
        />
      );
      this.reportToBuglyOutofRangeError(moreText, sign_in_range);
      return alertElem;
    };

    locationHelper.checkOutOfSignScope(
      navigation,
      poiLat,
      poiLgtd,
      signInJump,
      selectedRecord,
      f_getOutRangeAlertElem,
    );
  };
  reportToBuglyOutofRangeError = (moreText, sign_in_range) => {
    //moreText是提示给用户的，报给bugly的还需要userid、拜访id
    const customerId = _.get(
      this.props.navigation,
      'state.params.parentData.customer__r.id',
      'NotFound',
    );
    const account = fc_getCurrentUserInfo().account;
    const fullMessage =
      `FC_CRM_USERNAME=${global.FC_CRM_USERNAME};account=${account};customerId=${customerId};sign_in_range=${sign_in_range};` +
      moreText;
    const err = new Error(fullMessage);
    const whatIsDoing = this.getRightButtonTitle();
    err.name = whatIsDoing + '_OutofRangeError';
    RNBugly.reportJSError(err);
  };
  /**
   * TODO:
   * needed 会从 crmPowerSetting 中读取，字段待定;
   * content 是水印的内容，key 会从 layout 中读取，但是 value
   * 需要和对应的业务结合，所以以后的方法实现可能会变成如下工具方法
   * values1 和 values2 的内容因为无法控制其业务关系，所以会采用 hard code
   * 的方式取值。
   * function getWatermarkInfo (layout: any, getValue) {
   *    const keys = _.get(layout, 'xxx.xxx.watermark', []);
   *    const values1 = xxx; // values from utils or global
   *    const values2 = getValue(keys); // values from page
   *    return {
   *      needed: crmPowerSetting.watermark_needed || true,
   *      content: [...values1, ...values2]
   *    }
   * }
   */
  getWatermarkInfo = (selectRecord) => {
    const { userInfo, crmPowerSetting } = this.props;

    return {
      needed: !!crmPowerSetting.watermark_needed,
      content: [
        // userInfo.name,
        // 当应用于所有业务的时候，就应该适用到所有字段。
        // 我们可以使用 unicode 来给汉字做匹配，/[\u4e00-\u9fa5]{1,15}/g, 汉字以外则是 [[^\u4e00-\u9fa5]]{1,25}/g
        ...selectRecord.address.match(/.{1,18}/g),
        moment(selectRecord.time).format(WATERMARK_TIME_FORMAT),
      ],
    };
  };

  //* 渲染地点
  renderItem = (item: any) => {
    const index = _.get(item, 'index');
    const name = _.get(item, 'item.name');
    const address = _.get(item, 'item.addr');
    const itemUid = _.get(item, 'item.uid', '');
    const distance = _.get(item, 'item.distance');
    const { selectedUid } = this.state;

    if (distance > 1000) return null;
    return (
      <View key={itemUid} style={styles.rowItem}>
        <TouchableOpacity
          style={{
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'flex-start',
          }}
          onPress={() => this.handlePress(_.get(item, 'item.uid', ''))}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'center',
              justifyContent: 'flex-start',
            }}
          >
            <View style={{ alignItems: 'flex-start', flex: 5, marginBottom: 8 }}>
              <Text style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 2 }}>{name}</Text>
              {!TENANT_ID_COLLECT.JMKX_TENEMENT.includes(global.TEAMID) &&
              !_.isUndefined(distance) &&
              index !== 0 ? (
                <Text>{`距离当前位置${distance}米`} </Text>
              ) : null}
              <Text style={{ fontSize: 13 }}>{address}</Text>
            </View>
            <View
              style={{
                flex: 1,
                alignItems: 'flex-end',
                justifyContent: 'flex-start',
              }}
            >
              {((selectedUid && itemUid === selectedUid) || (!selectedUid && index === 0)) && (
                <Icon name="ios-checkmark" style={{ color: themes.fill_base_color }} />
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  getCustomerLoc = () => {
    const { navigation } = this.props;
    const parentData = _.get(navigation, 'state.params.parentData', {});
    const customerLat = _.get(parentData, 'customer__r.latitude');
    const customerLgtd = _.get(parentData, 'customer__r.longitude');
    return makeLatLgtd(customerLat, customerLgtd);
  };

  //总会返回string！
  getCustomerName = () => {
    const { navigation } = this.props;
    const parentData = _.get(navigation, 'state.params.parentData', {});
    const name = _.get(parentData, 'customer__r.name', '客户');
    return name;
  };

  renderMapView = () => {
    const { mapType, zoom, trafficEnabled, baiduHeatMapEnabled, center } = this.state;
    const customerLoc = this.getCustomerLoc();
    const customerName = this.getCustomerName();

    const mapStyle = { flex: 1 };
    return (
      <MapView
        scrollGesturesEnabled={true}
        zoomGesturesEnabled={true}
        trafficEnabled={trafficEnabled}
        baiduHeatMapEnabled={baiduHeatMapEnabled}
        zoomControlsVisible={false}
        zoom={zoom}
        mapType={mapType}
        center={center}
        style={mapStyle}
        onMarkerClick={(e) => {}}
        onMapClick={(e) => {}}
      >
        {MapScreen.renderMarkers(center, customerLoc, customerName)}
      </MapView>
    );
  };

  static renderMarkers(myLoc: {}, customerLoc: any, customerName: string) {
    // android的Marker点击后不显示title

    assert(_.isObject(myLoc));
    //customerLoc可能为null
    assert(_.isString(customerName));

    const markers = [];
    const myLocIcon = require('./MapScreen_icon_my_point.png');
    markers.push(<Overlay.Marker location={myLoc} icon={myLocIcon} title="我的位置" />);
    if (customerLoc) {
      const customerLocIcon = require('./MapScreen_icon_customer.png');
      markers.push(
        <Overlay.Marker
          location={customerLoc}
          icon={customerLocIcon}
          title={`${customerName}的位置`}
        />,
      );
    }

    return markers;
  }

  renderRefreshBtn = () => {
    //native-base中的Button
    //MapView底部有一个refreshBtn。如果是lookup，没有刷新按钮
    if (this.isLookUp) {
      return null;
    }
    const viewStyle = {
      position: 'absolute',
      bottom: 10,
      right: 10,
      paddingLeft: 16,
      paddingRight: 16,
      height: 44,
      borderRadius: 4,
      backgroundColor: 'white',
    };
    const shadowStyle = {
      shadowColor: 'black',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,

      elevation: 5,
    };
    const textStyle = {
      fontSize: 14,
      color: 'black',
    };
    const onPress = () => {
      this.setState(this.initialState);
      this.getCurrentPosition();
    };
    return (
      <TouchableHighlight
        onPress={onPress}
        style={[viewStyle, shadowStyle, styles.center]}
        underlayColor="#cccccc"
      >
        <Text style={textStyle}>重新定位</Text>
      </TouchableHighlight>
    );
  };

  renderMapViewWithRefreshBtn = () => {
    const { poiList } = this.state;
    const boxStyle = {
      width: ScreenWidth,
      height: poiList ? ScreenHeight / 2 : ScreenHeight,
    };
    return (
      <View style={boxStyle}>
        {this.renderMapView()}
        {this.renderRefreshBtn()}
      </View>
    );
  };

  renderContent = () => {
    const { center, poiList } = this.state;

    if (_.isEmpty(center)) {
      return <LoadingScreen isNormalSized />;
    }

    return (
      <React.Fragment>
        {this.renderMapViewWithRefreshBtn()}
        {poiList ? (
          <View style={styles.row}>
            <FlatList
              style={{ flex: 1, paddingBottom: 100 }}
              data={poiList}
              renderItem={this.renderItem}
            />
          </View>
        ) : null}
      </React.Fragment>
    );
  };

  renderHeader() {
    const { navigation, dispatch, screen } = this.props;
    return (
      <StyledHeader>
        <HeaderLeft
          style={{ flex: 1 }}
          navigation={navigation}
          dispatch={dispatch}
          screen={screen}
        />
        <Body style={{ flex: 1, alignItems: 'center' }}>
          <Title
            style={{
              color: themes.title_text_color,
              fontSize: themes.title_size,
            }}
          >
            {I18n.t('MapScreen.Position')}
          </Title>
        </Body>
        <Right style={{ flex: 1 }}>
          {this.type === 'sign' && (
            <Button
              transparent
              onPress={
                Throttle(this.selectDone, 2000)
                //   () => {
                //   processStatus === 'done' && Throttle(this.selectDone(), 2000);
                // }
              }
            >
              <Text style={{ color: themes.title_text_color }}>{this.getRightButtonTitle()}</Text>
            </Button>
          )}
        </Right>
      </StyledHeader>
    );
  }

  getRightButtonTitle() {
    const sign_type = _.get(this, 'props.navigation.state.params.sign_type', 'sign_in');
    if (sign_type === 'sign_in') {
      return I18n.t('MapScreen.CheckIn');
    } else {
      return '签出';
    }
  }

  render() {
    return (
      <StyledContainer style={{ backgroundColor: themes.fill_base }}>
        {this.renderHeader()}
        {this.renderContent()}
        {this.isLookUp && (
          <View style={styles.navWrapper}>
            <Button
              style={[commonStyles.actionButton, { opacity: 1 }]}
              onPress={this.openDeviceMap}
            >
              <Text style={{ color: '#fff', fontSize: 18 }}>{I18n.t('MapScreen.Navigate')}</Text>
            </Button>
          </View>
        )}
      </StyledContainer>
    );
  }
}

const select = (state, screen) => ({
  crmPowerSetting: state.settings.crmPowerSetting,
  userInfo: state.settings.userInfo,
});

export default connect(select)(MapScreen);

const styles = StyleSheet.create({
  row: {
    flex: 1,
    height: ScreenHeight / 2,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  map: {
    width: ScreenWidth,
    height: ScreenHeight / 2,
  },
  rowItem: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    // marginVertical: themes.v_spacing_md,
    marginTop: themes.v_spacing_md,
    marginHorizontal: themes.h_spacing_lg,
    borderBottomWidth: themes.regular_border_width,
    borderBottomColor: themes.border_color_base,
  },
  navWrapper: {
    position: 'absolute',
    bottom: 30,
    right: 0,
    left: 0,
  },
  navButton: {
    marginBottom: 40,
    paddingHorizontal: 30,
    alignSelf: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
