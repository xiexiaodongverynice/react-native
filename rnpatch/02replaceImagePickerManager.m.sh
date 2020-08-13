#!/bin/bash
set -x
cd $INIT_CWD
#使用setValue:forKey:它支持value为nil
cp -f rnpatch/ImagePickerManager.m node_modules/react-native-image-picker/ios/ImagePickerManager.m
