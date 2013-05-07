
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
  NSString *host = [[request URL] host];
  NSUInteger actionType = [[actionInformation valueForKey: WebActionNavigationTypeKey] unsignedIntValue];

  if (actionType == WebNavigationTypeLinkClicked) {
    // if the user clicks a link to another host
    // open the url in the default browser and
    // ignore the request here.
    if (host) {
      [[NSWorkspace sharedWorkspace] openURL:[request URL]];
      [listener ignore];
      return;
    }
  }

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

@implementation WebUIDelegate

- (void)webView:(WebView *)sender
  runOpenPanelForFileButtonWithResultListener:(id < WebOpenPanelResultListener >)resultListener
{
    NSOpenPanel* dlg = [NSOpenPanel openPanel];
    [dlg setCanChooseFiles:YES];
    [dlg setCanChooseDirectories:NO];
    [dlg setAllowsMultipleSelection:NO];
    if ([dlg runModal] == NSOKButton) {
        NSArray* files = [[dlg URLs]valueForKey:@"relativePath"];
        [resultListener chooseFilenames:files];
    }
}

@end
