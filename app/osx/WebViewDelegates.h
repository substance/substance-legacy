#import <Cocoa/Cocoa.h>
#import <Webkit/WebView.h>
#import <Webkit/WebFrameLoadDelegate.h>
#import <Webkit/WebPolicyDelegate.h>
#import <Webkit/WebUIDelegate.h>

#import "ExtendedWebView.h"

@interface WebViewLoadDelegate : NSObject
{
  WebViewWithExtensions *m_webView;
}

- initWithExtendedWebView: (WebViewWithExtensions *) webExtension;

- (void) webView:(WebView *)sender didCommitLoadForFrame:(WebFrame*) frame;

@end

@interface WebViewPolicyDelegate : NSObject
{
}

- (void)webView:(WebView *)webView
	decidePolicyForMIMEType:(NSString *)type
	request:(NSURLRequest *)request
	frame:(WebFrame *)frame
	decisionListener:(id < WebPolicyDecisionListener >)listener;

- (void)webView:(WebView *)sender
	decidePolicyForNavigationAction:(NSDictionary *) actionInformation
    request:(NSURLRequest *)request
    frame:(WebFrame *)frame
    decisionListener:(id < WebPolicyDecisionListener >)listener;

- (void)webView:(WebView *)webView
	decidePolicyForNewWindowAction:(NSDictionary *)actionInformation
	request:(NSURLRequest *)request
	newFrameName:(NSString *)frameName
	decisionListener:(id < WebPolicyDecisionListener >)listener;

@end

@interface WebUIDelegate : NSObject
{
}

- (void)webView:(WebView *)sender
  runOpenPanelForFileButtonWithResultListener:(id < WebOpenPanelResultListener >)resultListener;

@end