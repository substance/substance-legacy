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

@interface WebViewExtension: NSObject
{
  WebView *m_webView;
  JSCExtension m_extensions[5];
}

- (id) initWithWebView : (WebView *)webView;

- (WebView *) getWebView;

- (void) updateJSEngine;

- (void) addExtension: (JSCExtension) extension;

@end

@interface WebViewLoadDelegate : NSObject
{
  WebViewExtension *m_webExtension;
}

- init: (WebViewExtension *) webExtension;

- (void) webView:(WebView *)sender didCommitLoadForFrame:(WebFrame*) frame;

@end

