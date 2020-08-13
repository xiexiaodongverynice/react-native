//
//  RnBugly.h
//  MobileCRM
//
//  Created by 张琦 on 2019/9/25.
//  Copyright © 2019年 Facebook. All rights reserved.
//


#import <React/RCTBridgeModule.h>

@interface RNBugly : NSObject <RCTBridgeModule>

+ (void)startWithAppId;

@end
