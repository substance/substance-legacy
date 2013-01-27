#import "ExtendedWebView.h"

@implementation ContextContainer

- (id) initWithJSGlobalContext : (JSGlobalContextRef) context {
  m_context = JSGlobalContextRetain(context);
  return self;
}

- (void) dealloc {
  JSGlobalContextRelease(m_context);
  [super dealloc];
}

@end

@implementation WebViewWithExtensions

- (id) initWithWebView: (WebView *) webView
{
  m_webView = webView;
  for (int idx=0; idx < 5; ++idx) {
    m_extensions[idx] = 0;
  }
  m_context = nil;

  return self;
}

- (void) dealloc {
  if (m_context != nil) {
    [m_context release];
  }
  [super dealloc];
}


- (WebView*) getWebView
{
  return m_webView;
}

- (void) updateJSEngine
{
  if (m_context != nil) {
    [self performSelector:@selector(disposeContext:) withObject: m_context afterDelay:2.0];
    m_context = nil;
  }
  JSGlobalContextRef context = [[m_webView mainFrame] globalContext];
  m_context = [[ContextContainer new] initWithJSGlobalContext: context];
  for (int idx=0; idx < 5; ++idx) {
    if(m_extensions[idx] != 0) {
      m_extensions[idx](context);
    }
  }
}

- (void) addExtension:(JSCExtension) extension
{
  for (int idx=0; idx < 5; ++idx) {
    if(m_extensions[idx] == 0) {
      m_extensions[idx] = extension;
      break;
    }
  }
}

- (void) disposeContext: (id) context {
  [context release];
}

@end
