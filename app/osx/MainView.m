//
//  MainView.m
//  substance
//
//  Created by Oliver Buchtala on 9/28/12.
//
//

#import "MainView.h"

@implementation MainView


- (id)initWithFrame:(NSRect)frame
{
    self = [super initWithFrame:frame];
    if (self) {

    }

    return self;
}



- (void)drawRect:(NSRect)dirtyRect
{
    // Drawing code here.
    [super drawRect:dirtyRect];
}

- (BOOL)acceptsFirstResponder {
    return YES;
}

- (void) keyDown:(NSEvent *)theEvent {
    // Note: this consumes all key events that have not been handled
    //       by within the child views (e.g. WebView)
    //       if some application wide key handling is necessary, handle the keyEvent
    //[self interpretKeyEvents: [NSArray arrayWithObject:theEvent]];
}

@end

@implementation SubstanceWebView


@end
