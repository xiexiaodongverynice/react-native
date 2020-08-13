/**
 * Created by xiewm, 2019/06/10
 * @flow
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ListItem, Body, Left, Icon, Right } from 'native-base';
import _ from 'lodash';
import I18n from '../../i18n';
import detailScreen_styles from '../../styles/detailScreen_styles';

type Prop = {
  token: string,
  render: ?(title: string, data: any, desc: any, token: string) => any,
  desc: any,
  title: any,
  data: any,
  field: any,
  navigation: ?any,
  renderType: ?string,
  onStarChange: (val: string) => void,
  onChange: (val: string) => void,
  maxStars: number,
  disabled: boolean,
  rating: number,
  starSize: number,
  pageType: 'detail' | 'edit',
};

export default class StarRating extends React.PureComponent<Prop, {}> {
  constructor(props) {
    super(props);
    const roundedRating = Math.round(this.props.rating * 2) / 2;
    const { maxStars, rating } = this.props;
    const max = maxStars;

    if (rating == undefined) {
      this.state = {
        maxStars: max,
        rating: 0,
      };
    } else {
      this.state = {
        maxStars: max,
        rating: roundedRating,
      };
    }
  }
  componentWillReceiveProps(nextProp) {
    const { rating } = nextProp;
    const ratings = rating;
    if (ratings != this.state.rating) {
      this.setState({
        rating: ratings,
      });
    }
  }
  pressStarButton(ratings) {
    if (!this.props.disabled) {
      if (ratings != this.state.rating) {
        if (this.props.onStarChange) {
          this.props.onStarChange(ratings);
          this.props.onChange(ratings);
        }
        this.setState({
          rating: ratings,
        });
      }
    }
  }
  executeRender = () => {
    const { render, token, desc, title, renderType, field } = this.props;
    const show_label = _.get(field, 'show_label');
    const starsLeft = this.state.rating;
    const starButtons = [];

    for (let i = 0; i < this.state.maxStars; i += 1) {
      const starColor = i + 1 <= starsLeft ? styles.selectedColor : styles.unSelectedColor;
      const starStr = '\u2605';
      starButtons.push(
        <TouchableOpacity
          activeOpacity={0.2}
          key={i + 1}
          onPress={(e) => this.pressStarButton(i + 1)}
        >
          <Text style={[starColor, { fontSize: this.props.starSize }]}>{starStr}</Text>
        </TouchableOpacity>,
      );
    }
    const rightTextStyle =
      this.props.pageType === 'detail' ? detailScreen_styles.rightTextStyle : null;
    return (
      <Body style={{ flex: 1 }}>
        {show_label ? (
          <View style={[styles.starRatingContainer]}>
            {starButtons}
            {this.props.rating == undefined && !this.props.disabled ? (
              <Text style={{ marginTop: 4 }}>{I18n.t('StarRating.Text.PleaseSelect')}</Text>
            ) : (
              <Text style={[{ marginTop: 4 }, rightTextStyle]} decode="{{true}}">
                &nbsp;{starsLeft}
                {I18n.t('StarRating.Text.Stars')}
              </Text>
            )}
          </View>
        ) : (
          <View style={[styles.starRatingContainer]}>{starButtons}</View>
        )}
      </Body>
    );
  };
  render() {
    const { title, desc, renderType } = this.props;
    const noBorder = this.props.pageType === 'detail';
    const leftTextStyle =
      this.props.pageType === 'detail' ? detailScreen_styles.leftTextStyle : null;
    return (
      <View>
        {title ? (
          <ListItem noBorder={noBorder}>
            <Left style={{ alignItems: 'center' }}>
              <Text style={[{ width: 100 }, leftTextStyle]}>{title}</Text>
            </Left>
            {this.executeRender()}
          </ListItem>
        ) : (
          <ListItem
            style={{
              paddingRight: 0,
              borderBottomWidth: 0,
              marginLeft: 80,
              paddingBottom: 0,
              paddingTop: 0,
            }}
          >
            {this.executeRender()}
          </ListItem>
        )}
      </View>
    );
  }
}
const styles = StyleSheet.create({
  starRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectedColor: {
    color: '#FF4946',
  },
  unSelectedColor: {
    color: '#999999',
  },
});
