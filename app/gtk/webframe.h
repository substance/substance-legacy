#ifndef WEBVIEW_WEBFRAME_H_
#define WEBVIEW_WEBFRAME_H_

#include <wx/setup.h>

#if !wxUSE_WEBVIEW_WEBKIT
#error "A wxWebViewWebKit backend is required by this sample"
#endif

#include <wx/webview.h>
#include <wx/sharedptr.h>
#include <wx/frame.h>

#if defined(__WXGTK__)
#define WXGTK_CREATE_WEBINSPECTOR 1
#include <wx/gtk/webview_webkit.h>
#endif

#if defined(__WXOSX__)
#include <wx/osx/webview_webkit.h>
#endif

#ifdef WXGTK_CREATE_WEBINSPECTOR
#include "webinspector.h"
#endif

class WebFrame : public wxFrame {

public:
    WebFrame(const wxString& url);
    ~WebFrame();

    void OnClose(wxCloseEvent& evt);

    wxWebViewWebKit* GetWebView() { return m_browser; }

private:

    wxWebViewWebKit* m_browser;

#ifdef WXGTK_CREATE_WEBINSPECTOR
    WebInspector* m_inspector;
#endif

};

#endif // #ifndef WEBVIEW_WEBFRAME_H_
