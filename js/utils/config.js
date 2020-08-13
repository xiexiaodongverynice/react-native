/**
 * Created by Uncle Chalrie, 2017/12/05
 * This is from web project.
 */
import { stgEnvironment as environment } from './const';

module.exports = {
  ...environment,
  isCloseUpdate: true, // *是否关闭更新功能
  app_version: 'v1.1.10-20191122-1130',
  DOMAIN_LOGINNAME_DIC: {
    localhost: '@mundi.uat.cn',
    'dev.crmpower.cn': '@mundi.uat.cn',
    'stg.crmpower.cn': '@mundipharma.uat',
    'prod.crmpower.cn': '@mundipharma.com.cn',
    'mundi-cn.crmpower.cn': '@mundipharma.com.cn',
    'stg.sinepharm': '@sinepharm.stg',
    'prod.sinepharm': '@sinepharm.com',
  },
  apiPrefix: '/api/v1',
  baidumap: {
    getLocation:
      'https://api.map.baidu.com/place/v2/suggestion?query&output=json&ak=GaB5GAtci03EXT1648n4SB1aky6Z7M11',
    getradius:
      'https://api.map.baidu.com/geocoder/v2/?query&output=json&pois=1&radius=1000&ak=GaB5GAtci03EXT1648n4SB1aky6Z7M11',
    calcRoute:
      'https://api.map.baidu.com/direction/v2/driving?origin={origin}&destination={destination}&ak=GaB5GAtci03EXT1648n4SB1aky6Z7M11&waypoints={waypoints}',
  },
  api: {
    dashboard: '/dashboard',
    /**
     * 获取菜单接口
     */
    tab: '/rest/metadata/tab/',
    /**
     * 获取布局真实data所需要的接口 metadata
     * eg: /rest/data_record/{api_name}/{page_size}/{page_no}
     */
    data_record: '/rest/data_record',
    /**
     * 获取描述文件describe的接口
     * @params {api_name}:布局的api_name,
     */
    custom_objects_all: '/rest/metadata/object_describe/all',
    custom_object: '/rest/metadata/object_describe/:id', // includeFields=false
    /**
     * 获取布局数据
     */
    layout_version: '/rest/metadata/layout/', // {layoutId}
    all_layout: '/rest/metadata/layout/list/all',
    layout: '/rest/metadata/layout/',
    layout_by_object_layoutType: '/rest/metadata/layout/{objectApiName}/{layoutType}',
    layout_list_by_object: '/rest/metadata/layout/list/{objectApiName}',
    /**
     * 设计数据的CRUD所需要用到的接口
     */
    record_base: '/rest/data_record',
    record: '/rest/data_record/{api_name}', // ?includeDeleted=false
    multiple_record: '/rest/data_record/batchCreate/',
    record_query: '/rest/data_record/query', // post
    multiple_query: '/rest/data_record/batch_query', // post
    update_notice: '/rest/data_record/notice_read_log', // update
    record_detail: '/rest/data_record/{api_name}/{id}', // ?includeDeleted=false
    record_del: '/rest/data_record/{api_name}/{id}',
    record_ubatch: '/rest/data_record/ubatch/{api_name}',
    record_list_part: '/rest/data_record/{api_name}/{pageSize}/{pageNo}', // ?includeDeleted=false
    /**
     * 用户数据相关
     */
    coach_user_info: '/rest/user_info/listSubordinate/{id}',
    subordinate_query: '/rest/user_info/listSubordinate/',
    territory_customer_query: '/rest/data_record/listCustomerId',
    tutorial_query: '/rest/user_info/listTutorial/{id}',
    list_tutorial_territory: '/rest/user_info/listTutorialTerritory/{id}',
    territory_id_query: '/rest/user_info/listTerritory',
    user_data: '/rest/data_record/user_info',
    // KPI
    kpi: 'rest/kpi/{user_id}',
    /**
     * Calendar
     */
    calendar_layout: '/calendar/layout',
    calendar_record: '/calendar/record',
    /**
     * 活动打印
     */
    event_print: 'rest/data_record/print/{api_name}/{id}',
    encrypt_jwt: '/rest/encrypt/jwt',
    calendar_setting: '/rest/metadata/setting/calendar_setting',
    home_config: '/rest/metadata/setting/{phoneHomeConfing}?token=query',

    call_record_type_config: '/rest/metadata/setting/call_record_type_config?token=query',

    /**
     * 拜访模板
     */
    // template copy
    templateCopy: '/rest/call_template/{id}/copy',
    // template apply
    templateApply: '/rest/call_template/{id}/apply',

    /** upload image */
    upload_image: '/rest/images/', // {key}
    /** files */
    upload_files: '/rest/files/', // {key}

    /**
     * 自定义action请求地址
     */
    custom_action: '/rest/action/',

    // 获取服务器时间
    getServerTime: '/rest/time',
    // 国际化请求
    default_language: '/rest/metadata/setting/default_language?token=query',
    all_language: '/rest/metadata/translation/language/all?token=query',

    //* 审批流
    approval_flow: '/rest/approval_flow',

    //* customerAction
    object_customer_action_summury: '/rest/action/{api_name}/{api_name}_summary',

    //*App更新信息
    hotReload_status: '/hotReload/status',

    // * 性能接口
    performance: '/rest/system/performance/collector',

    // * 预览
    preview: '/rest/preview/upload?attachment={attachment}&token=query',
  },
};
