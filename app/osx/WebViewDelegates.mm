
#import "WebViewDelegates.h"

@implementation WebViewLoadDelegate

- (id) initWithExtendedWebView:(WebViewWithExtensions *)webExtension
{
  [super init];
  m_webView = webExtension;
  return self;
}

/*
- (void) webView:(WebView *)webView didClearWindowObject:(WebScriptObject *)windowObject forFrame:(WebFrame *)frame
{
  [m_webExtension updateJSEngine];
}
 */

- (void) webView:(WebView *)sender didCommitLoadForFrame:(WebFrame *)frame
{
  [m_webView updateJSEngine];
}

@end

@implementation WebViewPolicyDelegate

- (void)webView:(WebView *)webView
  decidePolicyForMIMEType:(NSString *)type
  request:(NSURLRequest *)request
  frame:(WebFrame *)frame
  decisionListener:(id < WebPolicyDecisionListener >)listener
{
  [listener use];
}

- (void)webView:(WebView *)sender
  decidePolicyForNavigationAction:(NSDictionary *)actionInformation
  request:(NSURLRequest *)request
  frame:(WebFrame *)frame
  decisionListener:(id < WebPolicyDecisionListener >) listener
{
  NSLog(@"Received policy decision request for navigation.");

  // accept the navigation request
  [listener use];
}

- (void)webView:(WebView *)webView
  decidePolicyForNewWindowAction:(NSDictionary *)actionInformation
  request:(NSURLRequest *)request
  newFrameName:(NSString *)frameName
  decisionListener:(id < WebPolicyDecisionListener >)listener
{

  [listener use];
}

@end
