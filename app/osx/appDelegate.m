#import "appDelegate.h"

@implementation SubstanceAppDelegate

@synthesize window;
@synthesize webView;

- (void)applicationDidFinishLaunching:(NSNotification *)aNotification {	
	NSString *url = @"http://www.google.at";
	[ [webView mainFrame] loadRequest: 
		[NSURLRequest requestWithURL: [NSURL URLWithString:url] ]
	];
}

@end
