//
//  RnDeviceInfo.m
//  rn_demo
//
//  Created by 张琦 on 2019/5/28.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import "RnDeviceInfo.h"
#import "GSKeyChainDataManager.h"
@implementation RnDeviceInfo

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE(DeviceInfoModule);
//  对外提供调用方法,Callback
RCT_EXPORT_METHOD(getDeviceId:(RCTResponseSenderBlock)callback)
{
  
  NSString *UUID = [GSKeyChainDataManager readUUID];
  if(UUID == NULL){
    NSString *newUUID = [RnDeviceInfo createUUID];
    NSLog(@"newuuid:%@",newUUID);
    [GSKeyChainDataManager saveUUID:newUUID];
    UUID = [GSKeyChainDataManager readUUID];
  }
  NSLog(@"UUID:%@",UUID);
  //  NSString *version = [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleShortVersionString"];//获取项目版本号
  callback(@[[NSNull null],UUID]);
}

/**
 *  生成32位UUID
 */
+ (NSString *)createUUID{
  
  CFUUIDRef uuid_ref = CFUUIDCreate(NULL);
  CFStringRef uuid_string_ref= CFUUIDCreateString(NULL, uuid_ref);
  NSString *uuid = [NSString stringWithString:(__bridge NSString *)uuid_string_ref];
  CFRelease(uuid_ref);
  CFRelease(uuid_string_ref);
  
  //去除UUID ”-“
  NSString *UUID = [[uuid lowercaseString] stringByReplacingOccurrencesOfString:@"-" withString:@""];
  
  return UUID;
}

@end

