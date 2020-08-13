//
//  RNZipArchive_fix_build_error.h
//  RNZipArchive_fix_build_error
//
//  Created by n on 2019/10/30.
//  Copyright © 2019 summerwuOrganization. All rights reserved.
//

#import <Foundation/Foundation.h>
// RNZipArchive和CodePush都引入了aes，总会提示 Redefinition of 'tm_unz_s'
// 所以只能手动配置RNZipArchive
@interface RNZipArchive_fix_build_error : NSObject

@end
