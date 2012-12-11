#import "appDelegate.h"

extern bool redis_initialize_jsobjects(JSGlobalContextRef context);

@implementation SubstanceAppDelegate

@synthesize window;
@synthesize webView;
@synthesize mainView;

- (void)applicationDidFinishLaunching:(NSNotification *)aNotification {
  [mainView setWebView: webView];

    // Start a webview with the bundled index.html file
	NSString *path = [[NSBundle mainBundle] bundlePath];

    // launch the redis db
  m_redisProcess = [NSTask new];
  [m_redisProcess setLaunchPath:[NSString stringWithFormat: @"%@/Contents/Redis/redis-server", path]];
  [m_redisProcess setCurrentDirectoryPath:[NSString stringWithFormat: @"%@/Contents/Redis", path]];
  [m_redisProcess launch];

  m_webExtension = [[WebViewExtension alloc] init: webView];
  [m_webExtension addExtension: (JSCExtension) redis_initialize_jsobjects];

  m_loadDelegate = [[WebViewLoadDelegate alloc] init: m_webExtension];
  [webView setFrameLoadDelegate: m_loadDelegate];

  NSString *url =  [NSString stringWithFormat: @"file://%@/Contents/Assets/index.html", path];
	[ [webView mainFrame] loadRequest: 
		[NSURLRequest requestWithURL: [NSURL URLWithString:url] ]
	];
}

- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)sender {
    return YES;
}

- (void)applicationWillTerminate:(NSNotification *)aNotification {
  [m_redisProcess terminate];
}

@end
