//
//  RnDeviceInfo.h
//  rn_demo
//
//  Created by 张琦 on 2019/5/28.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

@interface RnDeviceInfo : NSObject <RCTBridgeModule>

+ (NSString *)createUUID;

@end


