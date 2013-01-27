//
//  MainView.m
//  substance
//
//  Created by Oliver Buchtala on 9/28/12.
//
//

#import "MainView.h"
#import <WebKit/WebFrame.h>

@implementation MainView

-(void) setWebView: (WebView*) webView
{
  m_webView = webView;
}

- (BOOL)acceptsFirstResponder {
    return YES;
}

- (void) keyDown:(NSEvent *)theEvent {

  unsigned int flags = [theEvent modifierFlags];
  // Note: this consumes all key events that have not been handled
  //       by within the child views (e.g. WebView)
  //       if some application wide key handling is necessary, handle the keyEvent
  if( flags & NSCommandKeyMask) {

    // Reload on Command + r
    if([[theEvent characters] characterAtIndex:0] == 'r') {
      [m_webView reload: self];
    }

    // Command+Ctrl+Alt
    if(flags & (NSControlKeyMask | NSAlternateKeyMask)) {

      if(flags & NSNumericPadKeyMask) {
        NSString *theArrow = [theEvent charactersIgnoringModifiers];
        if ([theArrow length] == 1) {
          unichar keyChar = [theArrow characterAtIndex:0];

          // Command+Ctrl+Alt + left = Back
          if (keyChar == NSLeftArrowFunctionKey) {
            [m_webView goBack];
          }
          // Command+Ctrl+Alt + right = Forward
          else if (keyChar == NSRightArrowFunctionKey) {
            [m_webView goForward];
          }
        }
      }
    }
  }

}
@end
