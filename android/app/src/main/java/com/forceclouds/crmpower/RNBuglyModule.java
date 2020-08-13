package com.forceclouds.crmpower;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReadableMap;
import com.tencent.bugly.crashreport.CrashReport;

import java.io.PrintStream;
import java.io.PrintWriter;
import java.util.Stack;

public class RNBuglyModule extends ReactContextBaseJavaModule {

  public static class MockedJSException extends Throwable{
    String name;
    String message;
    String stack;

    public MockedJSException(String name, String message, String stack) {
      this.name = name;
      this.message = message;
      this.stack = stack;
    }

    @Override
    public String getMessage() {
      return this.message;
    }

    @Override
    public String getLocalizedMessage() {
      return this.getMessage();
    }

    @Override
    public synchronized Throwable getCause() {
      return null;
    }

    @Override
    public synchronized Throwable initCause(Throwable cause) {
      return null;
    }

    @Override
    public String toString() {
      return this.name + this.message;
    }

    @Override
    public void printStackTrace() {
      System.out.printf(this.stack);
    }

    @Override
    public void printStackTrace(PrintStream s) {
      s.print(this.stack);
    }

    @Override
    public void printStackTrace(PrintWriter s) {
      s.write(this.stack);
    }

    @Override
    public synchronized Throwable fillInStackTrace() {
      return null;
    }

    @Override
    public StackTraceElement[] getStackTrace() {
      String[] stacks = this.stack.split("\n");
      StackTraceElement[] elements = new StackTraceElement[stacks.length];
      for (int i = 0; i < stacks.length; i++) {
        String oneStack = stacks[i];
        StackTraceElement elem = new StackTraceElement("",oneStack,"",0);
        elements[i] = elem;
      }

      return elements;
    }

    @Override
    public void setStackTrace(StackTraceElement[] stackTrace) {

    }
  }



  private final ReactApplicationContext reactContext;

  

  public RNBuglyModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    return "RNBugly";
  }

  @ReactMethod
  public void setUserIdentifier(String userID) {
    CrashReport.setUserId(userID);
  }

  @ReactMethod
  public void updateAppVersion(String version) {
    CrashReport.setAppVersion(this.getReactApplicationContext(), version);
  }

//  @ReactMethod
//  public void reportError(String message) {
//    // Throwable message
//    CrashReport.postCatchedException(new Throwable("error") );
//  }

//  @ReactMethod
//  public void reportException(ReadableMap params) {
//    // Throwable message
//    String reason = params.getString("reason");
//    Throwable name = new Throwable(params.getString("name"));
//    CrashReport.postCatchedException(new Throwable(reason, name));
//  }

  @ReactMethod
  public void reportJSError(ReadableMap jserror){
    String name = jserror.getString("name");
    String message = jserror.getString("message");
    String stack = jserror.getString("stack");
    MockedJSException exception = new MockedJSException(name,message,stack);
    CrashReport.postCatchedException(exception);
  }
}