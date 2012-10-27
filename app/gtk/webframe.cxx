#include "webframe.h"
#include <wx/sizer.h>

#if defined(__WXOSX__)
#include <wx/osx/webview_webkit.h>
#endif

#if !defined(__WXMSW__) && !defined(__WXPM__)
    #include "substance.xpm"
#endif

WebFrame::WebFrame(const wxString& url): wxFrame(NULL, wxID_ANY, "webframe")
{

#if defined(__WXOSX__)
    // TODO: is it really necessary to enable the webinspector in advance?
    wxWebViewWebKit::EnableWebInspector();
#endif

    SetIcon(wxICON(substance));
    SetTitle("Substance");

    wxBoxSizer* top_sizer = new wxBoxSizer(wxVERTICAL);

    m_browser = new wxWebViewWebKit(this, wxID_ANY, url);
    top_sizer->Add(m_browser, wxSizerFlags().Expand().Proportion(1));
    SetSizer(top_sizer);
    SetSize(wxSize(800, 600));

    Connect(GetId(), wxEVT_CLOSE_WINDOW, wxCloseEventHandler(WebFrame::OnClose), NULL, this);

#ifdef WXGTK_CREATE_WEBINSPECTOR
    m_inspector = new WebInspector(m_browser);
#endif

}

WebFrame::~WebFrame()
{
}

void WebFrame::OnClose(wxCloseEvent& evt)
{
#ifdef WXGTK_CREATE_WEBINSPECTOR
    if(m_inspector)
        m_inspector->Destroy();
#endif
    evt.Skip();
}
