/**
 * Created by Uncle Charlie, 2018/01/21
 * @flow
 */
import React from 'react';
import { View, Text } from 'react-native';
import ComponentField from './ComponentField';

export default function createField(options: any, form: any) {
  return function createDecoratorField(field) {
    return (
      <ComponentField name={options.name} {...form}>
        {form.getFieldDecorator(options.name, options.validOptions)(field)}
      </ComponentField>
    );
  };
}
