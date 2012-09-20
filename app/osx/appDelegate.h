#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>

@interface SubstanceAppDelegate : NSObject <NSApplicationDelegate> {
    NSWindow *window;
	WebView *webView;
}

@property (assign) IBOutlet NSWindow *window;
@property (nonatomic, retain) IBOutlet WebView *webView;

@end
