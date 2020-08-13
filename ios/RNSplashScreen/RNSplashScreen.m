/**
 * SplashScreen
 * 启动屏
 * from：http://www.devio.org
 * Author:CrazyCodeBoy
 * GitHub:https://github.com/crazycodeboy
 * Email:crazycodeboy@gmail.com
 */

#import "RNSplashScreen.h"
#import <React/RCTBridge.h>

static UIView *splashView = nil;
static BOOL isWorking = NO;

@interface RNSplashScreen ()
@end

@implementation RNSplashScreen

- (dispatch_queue_t)methodQueue{
  return dispatch_get_main_queue();
}

RCT_EXPORT_MODULE(SplashScreen)
+ (void)show{
  if (isWorking) {
    return;
  }

  UIWindow *keyWindow = [UIApplication sharedApplication].keyWindow;
  splashView = [[[NSBundle mainBundle] loadNibNamed:@"LaunchScreen" owner:self options:nil] objectAtIndex:0];
  splashView.frame = keyWindow.bounds;
  NSLog(@"RNSplashScreen splashView:%@",splashView);
  [keyWindow addSubview:splashView];

  isWorking = NO;
}

+ (void)hide{
  if (isWorking) {
    return;
  }

  [splashView removeFromSuperview];
  splashView = nil;
  isWorking = NO;
}

RCT_EXPORT_METHOD(hide) {
  [self.class hide];
}

RCT_EXPORT_METHOD(show) {
  [self.class show];
}

@end

