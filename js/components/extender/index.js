import CallExtender from './callProduct/CallExtender';
import LocationForm from './map/LocationForm';
import RelatedDetailFormItem from '../../tabs/common/RelatedDetailFormItem';
import SignInForm from './map/SignInForm';
import CustomSignInForm from './map/CustomSignInForm';
import FeatureFilmsExtender from './featureFilm/FeatureFilmsExtender';
import DayCalenderView from './calendar/DayCalenderView';

const DETAIL_EXTENSION_CONFIGS = {
  CallProductKeyMessageFormItem: {
    component: CallExtender,
  },
  GeographicalLocationFormItem: {
    component: LocationForm,
  },
  RelatedDetailFormItem: {
    component: RelatedDetailFormItem,
    extensionalPropsFields: ['permission'],
  },
  SignInLiteFormItem: {
    component: SignInForm,
    extensionalPropsFields: ['disabled'],
  },
  CustomSignFormItem: {
    component: CustomSignInForm,
    extensionalPropsFields: ['disabled'],
  },
  FeatureFilmsExtender: {
    component: FeatureFilmsExtender,
  },
  ObjectCalenderDisplayItem: {
    component: DayCalenderView,
    extensionalPropsFields: ['handleSectionData', 'components'],
  },
};

const EDIT_AND_ADD_EXTENSION_CONFIGS = {
  CallProductKeyMessageFormItem: {
    component: CallExtender,
  },
  RelatedDetailFormItem: {
    component: RelatedDetailFormItem,
    extensionalPropsFields: ['permission'],
  },
  SignInLiteFormItem: {
    component: SignInForm,
    extensionalPropsFields: ['disabled', 'form', 'createRecord'],
  },
  CustomSignFormItem: {
    component: CustomSignInForm,
    extensionalPropsFields: ['disabled', 'form', 'createRecord', 'currentDesc'],
  },
  FeatureFilmsExtender: {
    component: FeatureFilmsExtender,
    extensionalPropsFields: ['data', 'form'],
  },
  ObjectCalenderDisplayItem: {
    component: DayCalenderView,
    extensionalPropsFields: [
      'handleSectionData',
      'components',
      'handlerTimeChange',
      'defaultCalenderTime',
    ],
  },
  SegmentationHistoryFormItem: {
    component: FeatureFilmsExtender,
  },
};

export { DETAIL_EXTENSION_CONFIGS, EDIT_AND_ADD_EXTENSION_CONFIGS };
