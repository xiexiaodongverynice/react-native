/**
 *@flow
 */
import React from 'react';
import { View } from 'react-native';
import _ from 'lodash';
import { ListItem, Button, ActionSheet, Text, Icon } from 'native-base';
import { intlValue } from '../../../utils/crmIntlUtil';
import { CALL_CLM_KEY } from './const';
import handleUpdateCascade, {
  CASCADE_CREATE,
  CASCADE_DELETE,
  CASCADE_UPDATE,
} from '../../../utils/helpers/handleUpdateCascade';

type Prop = {
  keyMessageReaction: any,
  selected: any,
  navigation: any,
  pageType: string,
  clmData: any,
  dispatch: void,
  parentCallId: any,
};

export default class CallClmRowItem extends React.Component<Prop, {}> {
  selectOpinion = () => {
    const { selected, keyMessageReaction, dispatch, parentCallId } = this.props;
    const buttons = _.map(keyMessageReaction, (x) => x.label);
    const optionValue = [].concat(buttons, [intlValue('action.cancel')]);
    ActionSheet.show(
      {
        options: optionValue,
        cancelButtonIndex: optionValue.length - 1,
        destructiveButtonIndex: optionValue.length - 1,
        title: intlValue('action.clm_reaction'),
      },
      (buttonIndex) => {
        const clmOpinion = _.find(keyMessageReaction, {
          label: `${optionValue[buttonIndex]}`,
        });

        const updateClm = _.assign({}, selected, { reaction: _.get(clmOpinion, 'value') });

        handleUpdateCascade({
          data: updateClm,
          relatedListName: CALL_CLM_KEY,
          status: CASCADE_UPDATE,
          parentId: parentCallId,
          dispatch,
        });
      },
    );
  };

  deleteClm = () => {
    const { selected, dispatch, parentCallId } = this.props;

    const _id = _.get(selected, '_id');
    if (_id) {
      _.set(selected, '_id', _id);
    }

    handleUpdateCascade({
      data: selected,
      relatedListName: CALL_CLM_KEY,
      status: CASCADE_DELETE,
      parentId: parentCallId,
      dispatch,
    });
  };

  renderRight = () => {
    const { selected, keyMessageReaction, pageType } = this.props;
    const reaction = _.get(selected, 'reaction');
    const reactionItem = _.find(keyMessageReaction, { value: reaction });
    let optionLabel = _.get(reactionItem, 'label') || '';

    if (pageType !== 'detail') {
      optionLabel = optionLabel || intlValue('action.common_select');
      return (
        <Button
          transparent
          style={{ flex: 1.4 }}
          onPress={() => {
            this.selectOpinion();
          }}
        >
          <Text>{optionLabel}</Text>
        </Button>
      );
    }

    return (
      <Text style={{ fontSize: 13, fontFamily: 'PingFangSC-Regular', color: '#666666' }}>
        {optionLabel}
      </Text>
    );
  };

  handleItemPress = () => {
    const { navigation, selected } = this.props;

    if (!selected) {
      return;
    }

    navigation.navigate('Detail', {
      navParam: {
        objectApiName: 'clm_presentation',
        record_type: 'master',
        id: _.get(selected, 'clm_presentation'),
      },
    });
  };

  render() {
    const { selected, clmData, pageType } = this.props;
    const descClm = _.find(clmData, (e) => _.get(e, 'id') === _.get(selected, 'clm_presentation'));

    return (
      <ListItem onPress={this.handleItemPress} style={{ borderColor: '#fff' }}>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {pageType !== 'detail' && (
            <Button transparent style={{ flex: 1 }} onPress={this.deleteClm}>
              <Icon name="ios-remove-circle-outline" style={{ color: 'red' }} />
            </Button>
          )}
          <Text
            style={{ flex: 3, fontSize: 13, fontFamily: 'PingFangSC-Regular', color: '#666666' }}
          >
            {_.get(selected, 'clm_presentation__r.name') || _.get(descClm, 'name')}
          </Text>
          {this.renderRight()}
        </View>
      </ListItem>
    );
  }
}
