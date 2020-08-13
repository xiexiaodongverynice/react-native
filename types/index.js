/**
 * Created by Uncle Charlie, 2018/01/10
 * @flow
 */

declare var jest: any;
declare var jasmine: any;
declare var describe: (name: string, callback: () => void) => void;
declare var it: (name: string, callback: () => void) => void;
declare var expect: any;
declare var isAboveIPhone8: boolean;
declare var isAndroid: boolean;
declare var isIOS: boolean;
declare var NAV_BAR_HEIGHT: number;
declare var FC_CRM_TOKEN: string;
declare var SCREEN_HEIGHT: number;
declare var SCREEN_WIDTH: number;
declare var _: Function;
declare var fc_getCurrentUserInfo: (?string) => any;

// Object descriptions
declare interface DescriptionField {
  api_name: string;
  id: number;
  label: string;
  type: string;
  is_virtual: boolean;
}

declare interface DescriptionItem {
  api_name: string;
  id: number;
  package: string;
  record_types: Array<string>;
  fields: Array<DescriptionField>;
}

// Filter operations & values

declare interface FilterOperation {
  label: string;
  value: string;
}

// Common
declare type ScreenInfo = {
  objectApiName: string,
  recordType: string,
};

declare type PhoneLayout = {
  title: string,
  sub_title: string,
  contents: Array<string>,
};

declare type Filter = {
  condition: ?string,
  op: ?string,
  value: ?string,
};

// Layout
declare interface Field {
  field: string;
  is_link?: boolean;
}

declare interface Action {
  label: string;
  action: string;
  show_when?: string[];
  record_type?: string;
}

// declare interface Component {
//   type: string;
//   order: string;
//   fields: Array<Field>;
//   actions: Array<Action>;
//   row_actions: Action[];
//   show_filter: boolean;
//   filter_fields: string[];
//   default_sort_by: string;
//   default_sort_order: string;
//   object_describe_api_name: string;
// }

declare interface Container {
  container_id: number;
  components: Array<Component>;
}

declare type versionInfoType = {
  app_version: string,
  is_force_update: true,
  update_description: string,
  update_type: 0 | 1,
  ios_download_link: string,
  android_download_link: string,
};

declare interface Layout {
  containers: Container;
  id: number;
  record_type: string;
  display_name: string;
  object_describe_api_name: string;
  layout_type: string;
}

declare interface PhotoTypes {
  data: string;
  fileSize: number;
  height: number;
  width: number;
  isVertical: boolean;
  uri: string;
  latitude?: number;
  longitude?: number;
  timestamp?: string;
}

declare type CacheLocation = 'sys' | 'data' | 'layout';
