#ifndef WEBVIEW_WEBFRAME_H_
#define WEBVIEW_WEBFRAME_H_

#include <wx/setup.h>
#include <wx/webview.h>
#include <wx/sharedptr.h>
#include <wx/frame.h>
#include <wx/splitter.h>
#include <wx/gtk/webview_webkit.h>
#include "webinspector.h"

class MainFrame : public wxFrame {

public:
    MainFrame(const wxString& url);

    ~MainFrame();

    wxWebViewWebKit* GetWebView() { return browser; }

    void OnShowWebInspector(wxShowEvent& event);
    void OnCloseWebInspector(wxCloseEvent& event);

private:

    wxSplitterWindow* splitter;
    wxPanel* browserPanel;
    wxWebViewWebKit* browser;
    WebInspector* inspector;
};

#endif // #ifndef WEBVIEW_WEBFRAME_H_
