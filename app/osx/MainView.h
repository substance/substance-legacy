#import <Cocoa/Cocoa.h>
#import <Webkit/WebView.h>

@interface MainView : NSView
{
  WebView *m_webView;
}

-(void) setWebView: (WebView*) webView;

@end
