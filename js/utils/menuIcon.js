import { crmTenant_ishenrui } from '../utils/const';

const matchIcon = (item) => {
  const { record_type, object_describe_api_name, api_name } = item;

  if (crmTenant_ishenrui()) {
    switch (api_name) {
      case 'coach_feedback':
        return 'ios-create';
      case 'business_plan':
        return 'ios-trending-up';
      case 'dev_plan':
        return 'ios-list-box';
      case 'fi_assess_result':
        return 'ios-card';
      case 'ic_result_business':
        return 'ios-cash';
      case 'hrs_kpi_result':
        return 'ios-pie';
    }
  }

  switch (api_name) {
    case 'customer_dept_tab':
      return 'ios-contacts';
    case 'customer_hcp_tab':
      return 'ios-contact';
    case 'opportunity_master_tab':
      return 'ios-key';
    case 'project_master_tab':
      return 'ios-build';
    case 'instrument_master_tab':
      return 'hammer';
    case 'coach':
      return 'ios-hand';
    case 'coach_feedback_master_tab':
      return 'paper';
  }

  switch (object_describe_api_name) {
    case 'customer':
      if (record_type === 'hco') {
        return 'medkit';
      } else if (record_type === 'hcp') {
        return 'people';
      } else if (record_type === 'pharmacy') {
        return 'ios-flask';
      } else {
        return 'people';
      }
    case 'home':
      return 'home';
    case 'call':
      return 'megaphone';
    case 'call_plan':
      return 'megaphone';
    case 'event':
      return 'briefcase';
    case 'calendar':
      return 'calendar';
    case 'help':
      return 'hand';
    case 'bonus':
      return 'usd';
    case 'user':
      return 'person';
    case 'report':
      return 'podium';
    case 'product':
      return 'medkit';
    case 'coach_feedback':
      return 'pricetag';
    case 'time_off_territory':
      return 'time';
    case 'my_event':
      return 'md-radio';
    case 'my_vendor_approval':
      return 'ios-bulb';
    case 'approval_node':
      return 'ios-create';
    case 'my_promo_materials':
      return 'ios-albums';
    case 'my_vendor':
      return 'md-ribbon';
    case 'clm_presentation':
      return 'film';
    case 'medical_inquiry':
      return 'ios-clipboard';
    case 'alert':
      return 'ios-mail';
    case 'dcr':
      if (record_type === 'master') {
        return 'ios-filing';
      } else {
        return 'bookmark';
      }
    default:
      return 'bookmark';
  }
};

export default matchIcon;
