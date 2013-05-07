#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>
#import "MainView.h"
#import "ExtendedWebView.h"
#import "WebViewDelegates.h"

@interface ForkedSubProcess : NSObject {
	NSTask *m_task;
}

- (id) initWithTask: (NSTask *) task;

- (void) launch;

- (void) dealloc;

@end

@interface SubstanceAppDelegate : NSObject <NSApplicationDelegate> {
  NSWindow *window;
  MainView *mainView;
  WebView *webView;

  WebViewWithExtensions *m_webExtension;
  WebViewLoadDelegate *m_loadDelegate;
  WebViewPolicyDelegate *m_policyDelegate;
  WebUIDelegate *m_uiDelegate;
  ForkedSubProcess *m_redisProcess;
}

- (void) dispose;

@property (assign) IBOutlet NSWindow *window;
@property (assign) IBOutlet WebView *webView;
@property (assign) IBOutlet MainView *mainView;

@end
