#include <wx/sizer.h>

#include "mainframe.h"

MainFrame::MainFrame(const wxString& url): wxFrame(NULL, wxID_ANY, "Substance")
{
    wxImage::AddHandler(new wxPNGHandler());
    SetIcon(wxIcon("images/Substance.png", wxBITMAP_TYPE_PNG));
    SetTitle("Substance");

    wxBoxSizer* sizer1 = new wxBoxSizer(wxVERTICAL);

    splitter = new wxSplitterWindow(this, wxID_ANY, wxDefaultPosition, wxSize(1400,1000));
    splitter->SetSashGravity(0.75);
    splitter->SetMinimumPaneSize(20);

    browserPanel = new wxPanel(splitter, wxID_ANY);
    wxBoxSizer *sizer2 = new wxBoxSizer(wxVERTICAL);
    browser = new wxWebViewWebKit(browserPanel, wxID_ANY, url);
    sizer2->Add(browser, wxSizerFlags().Expand().Proportion(1));
    browserPanel->SetSizer(sizer2);

    inspector = new WebInspector(splitter, browser);

    // HACK: did not manage to find an appropriate way to let the splitter window
    //       layout initially. (Tried: splitter->Layout(), splitter->SetSashPosition() + splitter->UpdateSize()...)
    //       It helps to split and unsplit
    splitter->SplitHorizontally(browserPanel, inspector);
    splitter->Unsplit();

    sizer1->Add(splitter, 1, wxEXPAND, 0);
    SetSizer(sizer1);
    sizer1->SetSizeHints(this);

    Connect(inspector->GetId(), wxEVT_SHOW,
      wxShowEventHandler(MainFrame::OnShowWebInspector));

    Connect(inspector->GetId(), wxEVT_CLOSE_WINDOW,
      wxCloseEventHandler(MainFrame::OnCloseWebInspector));

}

MainFrame::~MainFrame()
{
}

void MainFrame::OnShowWebInspector(wxShowEvent& event)
{
  splitter->SplitHorizontally(browserPanel, inspector);
}

void MainFrame::OnCloseWebInspector(wxCloseEvent& event)
{
  splitter->Unsplit();
}
