#include "webinspector.h"
#include <webkit/webkit.h>

#if !defined(__WXMSW__) && !defined(__WXPM__)
    #include "substance.xpm"
#endif

#include <wx/sizer.h>

WebInspector::WebInspector(wxWebViewWebKit* browser):
    wxFrame(NULL, wxID_ANY, "")
{

    SetIcon(wxICON(substance));
    SetTitle("WebInspector");

    wxBoxSizer* topsizer = new wxBoxSizer(wxVERTICAL);

    m_inspector_view =  browser->CreateWebInspector(this, wxID_ANY);
    topsizer->Add(m_inspector_view, wxSizerFlags().Expand().Proportion(1));
    SetSizer(topsizer);

    SetSize(wxSize(800, 600));

    // don't close the inspector window, instead hide on close
    Connect(GetId(), wxEVT_CLOSE_WINDOW,
            wxCloseEventHandler(WebInspector::HideOnClose));
}

WebInspector::~WebInspector()
{
}

void WebInspector::HideOnClose(wxCloseEvent&)
{
    Hide();
}
