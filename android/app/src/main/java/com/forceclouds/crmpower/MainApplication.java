package com.forceclouds.crmpower;

import android.app.Application;
import com.AlexanderZaytsev.RNI18n.RNI18nPackage;
import com.facebook.react.ReactApplication;
import com.arthenica.reactnative.RNFFmpegPackage;
import com.brentvatne.react.ReactVideoPackage;
import com.imagepicker.ImagePickerPackage;
import org.lovebing.reactnative.baidumap.BaiduMapPackage;
import cn.jpush.reactnativejpush.JPushPackage;
import com.rnziparchive.RNZipArchivePackage;
import im.shimo.react.prompt.RNPromptPackage;
import com.github.yamill.orientation.OrientationPackage;
import com.rnfs.RNFSPackage;
import com.reactlibrary.RNReactNativeDocViewerPackage;
import com.microsoft.codepush.react.CodePush;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.oblador.vectoricons.VectorIconsPackage;
import com.tencent.bugly.crashreport.CrashReport;
import io.github.mr03web.softinputmode.SoftInputModePackage;
import java.util.Arrays;
import java.util.List;
import org.devio.rn.splashscreen.SplashScreenReactPackage;
import com.learnium.RNDeviceInfo.RNDeviceInfo;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {

    @Override
    protected String getJSBundleFile() {
      return CodePush.getJSBundleFile();
    }

    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new RNReactNativeDocViewerPackage(),
          new MainReactPackage(),
            new RNFFmpegPackage(),
            new ReactVideoPackage(),
            new ImagePickerPackage(),
            new JPushPackage(!BuildConfig.DEBUG, !BuildConfig.DEBUG),
            new RNZipArchivePackage(),
            new RNPromptPackage(),
            new OrientationPackage(),
            new RNI18nPackage(),
            new RNFSPackage(),
         new CodePush("GJX6E9EY4I7hbfii7Bwv0nFkSdS24ksvOXqog", getApplicationContext(), BuildConfig.DEBUG, "http://code-push.forceclouds.com/"),
          new BaiduMapPackage(),
          new VectorIconsPackage(),
          new RNBuglyPackage(),
          new RNFileViewerPackage(),
          new SoftInputModePackage(),
          new SplashScreenReactPackage(),
              new RNDeviceInfo()

      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    // SoLoader.init(this, /* native exopackage */ false);
    CrashReport.initCrashReport(getApplicationContext(), "", false); // 只移除 dev 环境，不要将更改应用到 prod
  }
}
