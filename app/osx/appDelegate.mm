#import "appDelegate.h"
#import "ExtendedNSFileManager.h"

extern "C" bool redis_initialize_jsobjects(JSGlobalContextRef context);

@implementation SubstanceAppDelegate

@synthesize window;
@synthesize webView;
@synthesize mainView;

- (void)applicationDidFinishLaunching:(NSNotification *)aNotification {

#ifdef DEVELOPER_EXTRAS
//  [[NSUserDefaults standardUserDefaults] setBool:TRUE forKey:@"WebKitDeveloperExtras"];
//  [[NSUserDefaults standardUserDefaults] synchronize];
#endif // DEVELOPER_EXTRAS

  [mainView setWebView: webView];

  ExtendedNSFileManager *fs = [[ExtendedNSFileManager new] initWithFileManager: [NSFileManager defaultManager]];

    // Start a webview with the bundled index.html file
  NSString *path = [[NSBundle mainBundle] bundlePath];
  NSString *appDataDir = [fs applicationSupportDirectory];

    // launch the redis db
  m_redisProcess = [NSTask new];
  [m_redisProcess setLaunchPath:[NSString stringWithFormat: @"%@/Contents/Redis/redis-server", path]];
  [m_redisProcess setCurrentDirectoryPath: appDataDir];
  [m_redisProcess setArguments:[NSArray arrayWithObjects:
    [NSString stringWithFormat: @"%@/Contents/Redis/redis.conf", path], nil]];
  [m_redisProcess launch];

  m_webExtension = [[WebViewWithExtensions alloc] initWithWebView: webView];
  [m_webExtension addExtension: (JSCExtension) redis_initialize_jsobjects];

  m_loadDelegate = [[WebViewLoadDelegate alloc] initWithExtendedWebView: m_webExtension];
  [webView setFrameLoadDelegate: m_loadDelegate];

  NSString *url =  [NSString stringWithFormat: @"file://%@/Contents/Assets/index.html", path];
	[ [webView mainFrame] loadRequest:
		[NSURLRequest requestWithURL: [NSURL URLWithString:url] ]
	];
}

- (void) dealloc {
  [super dealloc];
  [m_loadDelegate release];
  [m_webExtension release];
}

- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)sender {
    return YES;
}

- (void)applicationWillTerminate:(NSNotification *)aNotification {
  [m_redisProcess terminate];
}


- (void) keyDown:(NSEvent *)theEvent {
  // Note: this consumes all key events that have not been handled
  //       by within the child views (e.g. WebView)
  //       if some application wide key handling is necessary, handle the keyEvent
}

@end
