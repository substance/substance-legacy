#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>
#import "MainView.h"

@interface SubstanceAppDelegate : NSObject <NSApplicationDelegate> {
  NSWindow *window;
  MainView *mainView;
  WebView *webView;

  WebViewWithExtensions *m_webExtension;
  WebViewLoadDelegate *m_loadDelegate;
  NSTask *m_redisProcess;
}

@property (assign) IBOutlet NSWindow *window;
@property (assign) IBOutlet WebView *webView;
@property (assign) IBOutlet MainView *mainView;

@end
