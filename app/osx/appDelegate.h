#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>
#import "MainView.h"

@interface SubstanceAppDelegate : NSObject <NSApplicationDelegate> {
    NSWindow *window;
//    MainView *mainView;
	WebView *webView;
}



@property (assign) IBOutlet NSWindow *window;
//@property (assign) IBOutlet MainView *mainView;
@property (nonatomic, retain) IBOutlet WebView *webView;

@end
