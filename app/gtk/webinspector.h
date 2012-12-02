#ifndef _WEBINSPECTOR_H
#define _WEBINSPECTOR_H

#include "wx/setup.h"
#include <wx/panel.h>
#include <wx/gtk/webview_webkit.h>

class WebInspector: public wxPanel
{
public:
    WebInspector(wxWindow* parent, wxWebViewWebKit *web_view);

    ~WebInspector();

    void HideOnClose(wxCloseEvent& event);

private:
    wxWebViewWebKit* m_inspector_view;
};

#endif // _WEBINSPECTOR_H
