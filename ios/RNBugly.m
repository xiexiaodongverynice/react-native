//
//  RnBugly.m
//  MobileCRM
//
//  Created by 张琦 on 2019/9/25.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "RNBugly.h"
#import <Bugly/Bugly.h>

@implementation RNBugly

RCT_EXPORT_MODULE(RNBugly)

+ (void)startWithAppId
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    [Bugly startWithAppId:nil];
  });
}

RCT_EXPORT_METHOD(setUserIdentifier:(NSString *)userId)
{
  [Bugly setUserIdentifier:userId];
}

RCT_EXPORT_METHOD(updateAppVersion:(NSString *)version)
{
  [Bugly updateAppVersion:version];
}

//RCT_EXPORT_METHOD(reportError:(NSDictionary *)postInfo)
//{
//  NSError *errorInfo = [NSError errorWithDomain:NSURLErrorDomain code:121 userInfo:@{NSLocalizedDescriptionKey:postInfo[@"description"], NSLocalizedFailureReasonErrorKey:postInfo[@"reason"]}];
//  [Bugly reportError:errorInfo];
//}
//
//RCT_EXPORT_METHOD(reportException:(NSDictionary *)params)
//{
//  NSMutableDictionary *muDict = [NSMutableDictionary dictionaryWithDictionary:params];
//  [Bugly reportException:[NSException exceptionWithName:params[@"name"] reason:params[@"reason"] userInfo:muDict]];
//}

//js调用是直接将 Error对象传入即可
RCT_EXPORT_METHOD(reportJSError:(NSDictionary *)jserror){
  //  *    @param category    类型(Cocoa=3,CSharp=4,JS=5,Lua=6)
  //JS中的Error只有2个标准属性：name、message。rn中可以获取到stack属性
  NSUInteger categoryJS = 5;
  NSString *name = [jserror valueForKey:@"name"];
  NSString *message = [jserror valueForKey:@"message"];
  NSString *stack = [jserror valueForKey:@"stack"];
  NSArray *callStack = [stack componentsSeparatedByString:@"\n"];
  NSDictionary *extraInfo = @{};
  [Bugly reportExceptionWithCategory:categoryJS name:name reason:message callStack:callStack extraInfo:extraInfo terminateApp:NO];
}


@end

