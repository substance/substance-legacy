#import <Cocoa/Cocoa.h>
#import <Webkit/WebView.h>
#import <Webkit/WebFrame.h>
#import <JavaScriptCore/JavaScriptCore.h>

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
