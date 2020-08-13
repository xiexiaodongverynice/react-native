import _ from 'lodash';

export function getInitDisplayNames(apiName = '', title = '') {
  const initDisplayNames = {
    客户: ['A级', 'B级', 'KOL'],
    医院: ['一级', '二级', '三级'],
    拜访: ['计划中', '已完成', '已过期'],
    协访: ['新建', '待确认', '已确认'],
    活动: ['科室会', '圈子会', '城市会', '全国会'],
    离岗活动: ['出差', '会议', '培训', '休假', '其他'],
  };
  if (apiName == 'rx_medical_rsd') {
    initDisplayNames['活动'] = ['科室会', '圈子会'];
  }
  // console.log(initDisplayNames[title], apiName, title, 'initDisplayNames====>');
  return initDisplayNames[title];
}

export function getInitRegion(apiName = '') {
  if (apiName == 'rx_gm') {
    return ['学术', '北京', '东北', '广东', '华北', '华中', '苏鲁', '西北', '西南', '浙沪'];
  } else if (apiName == 'rx_ka_rsd') {
    return ['北京', '东北', '广东', '华北', '华中', '苏鲁', '西北', '西南', '浙沪'];
  } else if (apiName == 'rx_medical_rsd') {
    return ['学术'];
  } else {
    return [];
  }
}
