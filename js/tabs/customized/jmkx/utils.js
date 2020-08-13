const JMKX_PROFILE = {
  OTC: ['otc_gm', 'otc_rsd'],
  RX: ['rx_gm', 'rx_ka_rsd', 'rx_medical_rsd'],
};

const JMKX_DUTY = {
  OTC: ['OTC_全国总经理', 'OTC_销售一部经理', 'OTC_销售二部经理'],
  RX: ['RX_全国总经理', 'RX_学术副总', 'RX_KA副总'],
};

//哪些菜单是定制页
// CRM-4205
const JMKX_CUSTOMIZE_MENUS = {
  OTC: [
    {
      menu: '离岗活动',
      recordType: 'master',
      objectApiName: 'time_off_territory',
      record_type: ['master'],
    },
    {
      menu: '协访',
      recordType: 'master',
      objectApiName: 'coach_feedback',
      record_type: ['otc_ka', 'otc_distributor', 'otc_train'],
      status: ['0', '1', '2'],
      display_name_mapper: {
        '0': '新建',
        '1': '待确认',
        '2': '已确认',
      },
    },
    {
      menu: '客户',
      recordType: 'master',
      objectApiName: 'customer',
      record_type: ['pharmacy', 'distributor'],
    },
    {
      menu: '拜访',
      recordType: 'master',
      objectApiName: 'call',
      record_type: [
        'otc_plan',
        'otc_report',
        'otc_mg_plan',
        'otc_mg_report',
        'otc_kamg_plan',
        'otc_kamg_report',
        'otc_train_plan',
        'otc_train_report',
        'otc_rsm_report',
      ],
      status: ['计划中', '已执行', '已完成'],
      display_name_restricts: ['计划中', '已执行', '已完成'], // 限制有限的几个display_name
    },
  ],
  RX: [
    {
      menu: '客户',
      recordType: 'hcp',
      objectApiName: 'customer',
      record_type: ['hcp'],
      display_name_restricts: ['A级', 'B级', 'C级', 'D级', '未定级'],
    },
    {
      menu: '医院',
      recordType: 'hco',
      objectApiName: 'customer',
      record_type: ['hco'],
      hco_level: ['一级', '二级', '三级'],
      display_name_restricts: ['一级', '二级', '三级'],
      display_name: 'hco_level',
    },
    {
      menu: '拜访',
      recordType: 'master',
      objectApiName: 'call',
      record_type: ['group_plan', 'group_report'],
      status: ['计划中', '已执行', '已完成', '已取消'],
      display_name_restricts: ['计划中', '已执行', '已完成', '已取消'],
    },
    {
      menu: '协访',
      recordType: 'master',
      objectApiName: 'coach_feedback',
      record_type: ['sales'],
      status: ['0', '1', '2'],
      display_name_mapper: {
        '0': '新建',
        '1': '待确认',
        '2': '已确认',
      },
    },
    {
      menu: '活动',
      recordType: 'master',
      objectApiName: 'event',
      record_type: ['master'],
    },
    {
      menu: '离岗活动',
      recordType: 'master',
      objectApiName: 'time_off_territory',
      record_type: ['master'],
    },
  ],
};

const WHITE_PARAMS = ['status', 'display_name', 'hco_level'];

export { JMKX_PROFILE, JMKX_DUTY, JMKX_CUSTOMIZE_MENUS, WHITE_PARAMS };
