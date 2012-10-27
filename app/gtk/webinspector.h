#ifndef _WEBINSPECTOR_H
#define _WEBINSPECTOR_H

#if defined(__WXGTK__)

#include "wx/setup.h"

#include <wx/frame.h>
#include <wx/gtk/webview_webkit.h>

class WebInspector: public wxFrame
{
public:
    WebInspector(wxWebViewWebKit *web_view);

    ~WebInspector();

    void HideOnClose(wxCloseEvent& event);

private:
    wxWebViewWebKit* m_inspector_view;
};

#endif // #if defined(__WXGTK__)

#endif // _WEBINSPECTOR_H
