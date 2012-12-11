#import "appDelegate.h"

extern bool redis_initialize_jsobjects(JSGlobalContextRef context);

@implementation SubstanceAppDelegate

@synthesize window;
@synthesize webView;

- (void)applicationDidFinishLaunching:(NSNotification *)aNotification {
    // Start a webview with the bundled index.html file
	NSString *path = [[NSBundle mainBundle] bundlePath];

    // launch the redis db
  redisProcess = [NSTask new];
  [redisProcess setLaunchPath:[NSString stringWithFormat: @"%@/Contents/Redis/redis-server", path]];
  [redisProcess setCurrentDirectoryPath:[NSString stringWithFormat: @"%@/Contents/Redis", path]];
  [redisProcess launch];

  NSString *url =  [NSString stringWithFormat: @"file://%@/Contents/Assets/index.html", path];
	[ [webView mainFrame] loadRequest: 
		[NSURLRequest requestWithURL: [NSURL URLWithString:url] ]
	];
  
  WebFrame *webframe = [webView mainFrame];
  JSGlobalContextRef context = [webframe globalContext];
  redis_initialize_jsobjects(context);
  
}

- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)sender {
    return YES;
}

- (void)applicationWillTerminate:(NSNotification *)aNotification {
  [redisProcess terminate];
}

@end
