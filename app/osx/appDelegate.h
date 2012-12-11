#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>
#import "MainView.h"

@interface SubstanceAppDelegate : NSObject <NSApplicationDelegate> {
  NSWindow *window;
  WebView *webView;

  WebViewExtension *m_webExtension;
  WebViewLoadDelegate *m_loadDelegate;
  NSTask *m_redisProcess;
}

@property (assign) IBOutlet NSWindow *window;
@property (readonly, retain) IBOutlet WebView *webView;

@end
