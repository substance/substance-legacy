//
//  MainView.h
//  substance
//
//  Created by Oliver Buchtala on 9/28/12.
//
//

#import <Cocoa/Cocoa.h>
#import <Webkit/WebView.h>
#import <Webkit/WebFrameLoadDelegate.h>
#import <JavaScriptCore/JavaScriptCore.h>

@interface MainView : NSView
{
  WebView *m_webView;
}

-(void) setWebView: (WebView*) webView;

@end

typedef bool (*JSCExtension)(JSGlobalContextRef context);

@interface ContextContainer: NSObject
{
  JSGlobalContextRef m_context;
}

- (id) initWithJSGlobalContext : (JSGlobalContextRef) context;

- (void) dealloc;

@end

@interface WebViewWithExtensions: NSObject
{
  WebView *m_webView;
  JSCExtension m_extensions[5];
  ContextContainer *m_context;
}

- (id) initWithWebView : (WebView *)webView;

- (void) dealloc;

- (WebView *) getWebView;

- (void) updateJSEngine;

- (void) addExtension: (JSCExtension) extension;

- (void) disposeContext: (id) context;

@end

@interface WebViewLoadDelegate : NSObject
{
  WebViewWithExtensions *m_webView;
}

- initWithExtendedWebView: (WebViewWithExtensions *) webExtension;

- (void) webView:(WebView *)sender didCommitLoadForFrame:(WebFrame*) frame;

@end

