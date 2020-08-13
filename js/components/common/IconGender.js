// @flow
import IconIonicons from 'react-native-vector-icons/Ionicons';
import React from 'react';

type typeProps = {
  gender: string,
  size: number,
};
export default function GenderIcon(props: typeProps) {
  if (props.gender === 'male') {
    return <IconIonicons name="md-male" color="#56A8F7" />;
  } else if (props.gender === 'female') {
    return <IconIonicons name="md-female" color="#FF7CA8" />;
  } else {
    return null;
  }
}
