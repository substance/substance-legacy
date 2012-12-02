#include <webkit/webkit.h>
#include <wx/splitter.h>
#include <wx/sizer.h>

#include "webinspector.h"

WebInspector::WebInspector(wxWindow* parent, wxWebViewWebKit* browser):
    wxPanel(parent, wxID_ANY)
{
    wxBoxSizer* topsizer = new wxBoxSizer(wxVERTICAL);
    m_inspector_view =  browser->CreateWebInspector(this, wxID_ANY);
    topsizer->Add(m_inspector_view, wxSizerFlags().Expand().Proportion(1));
    SetSizer(topsizer);
    
    // don't close the inspector window, instead hide on close
    Connect(GetId(), wxEVT_CLOSE_WINDOW,
            wxCloseEventHandler(WebInspector::HideOnClose));
    
}

WebInspector::~WebInspector()
{
}

void WebInspector::HideOnClose(wxCloseEvent&)
{
}
