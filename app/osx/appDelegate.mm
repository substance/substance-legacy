#import <Cocoa/Cocoa.h>
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
  NSTask *redisProcess = [NSTask new];
  [redisProcess setLaunchPath:[NSString stringWithFormat: @"%@/Contents/Redis/redis-server", path]];
  [redisProcess setCurrentDirectoryPath: appDataDir];
  [redisProcess setArguments:[NSArray arrayWithObjects:
    [NSString stringWithFormat: @"%@/Contents/Redis/redis.conf", path], nil]];

  m_redisProcess = [[ForkedSubProcess alloc] initWithTask: redisProcess];
  [m_redisProcess launch];

  m_webExtension = [[WebViewWithExtensions alloc] initWithWebView: webView];
  [m_webExtension addExtension: (JSCExtension) redis_initialize_jsobjects];

  m_loadDelegate = [[WebViewLoadDelegate alloc] initWithExtendedWebView: m_webExtension];
  [webView setFrameLoadDelegate: m_loadDelegate];

  m_policyDelegate = [[WebViewPolicyDelegate alloc] init];
  [webView setPolicyDelegate: m_policyDelegate];

  // Escape blanks in bundle file path so that we can use it in the file url
  NSString *pathEscaped = (NSString *)CFURLCreateStringByAddingPercentEscapes(NULL, (CFStringRef)path,
   NULL,
   // add more characters if needed
   CFSTR(" "), kCFStringEncodingUTF8);

  NSString *url = [NSString stringWithFormat: @"file://%@/Contents/Assets/index.html", pathEscaped];

	[ [webView mainFrame] loadRequest:
		[NSURLRequest requestWithURL: [NSURL URLWithString:url] ]
	];
}

- (void) dispose {
  if (m_redisProcess) { [m_redisProcess release]; m_redisProcess = NULL; }
  if (m_loadDelegate) { [m_loadDelegate release]; m_loadDelegate = NULL; }
  if (m_policyDelegate) { [m_policyDelegate release]; m_policyDelegate = NULL; }
  if (m_webExtension) { [m_webExtension release]; m_webExtension = NULL; }
}

- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)sender {
    return YES;
}

- (void)applicationWillTerminate:(NSNotification *)aNotification {
  [self dispose];
}

- (void) keyDown:(NSEvent *)theEvent {
  // Note: this consumes all key events that have not been handled
  //       by within the child views (e.g. WebView)
  //       if some application wide key handling is necessary, handle the keyEvent
}

@end

@implementation ForkedSubProcess

- (id) initWithTask: (NSTask *) task {
  m_task = task;
  return self;
}

- (void) launch {
  [m_task launch];
}

- (void) dealloc {
  [m_task terminate];
  [m_task release];
  [super dealloc];
}

@end
