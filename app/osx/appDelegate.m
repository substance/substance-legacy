#import "appDelegate.h"


@implementation SubstanceAppDelegate

@synthesize window;
@synthesize webView;

- (void)applicationDidFinishLaunching:(NSNotification *)aNotification {
	NSString *path = [[NSBundle mainBundle] bundlePath];
	NSString *url =  [NSString stringWithFormat: @"file://%@/Contents/Assets/index.html", path];
	[ [webView mainFrame] loadRequest: 
		[NSURLRequest requestWithURL: [NSURL URLWithString:url] ]
	];
}

- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)sender {
    return YES;
}

@end
