#include <wx/wx.h>
#include <wx/webkit_jsc_extension.h>
#include <wx/webviewarchivehandler.h>
#include <wx/filesys.h>
#include <JavaScriptCore/JavaScript.h>
#include "webframe.h"

extern "C" bool redis_docstore_initialize(JSGlobalContextRef context);

class SubstanceApp: public wxApp
{
    virtual bool OnInit();
    WebFrame *frame;
};

IMPLEMENT_APP(SubstanceApp)

bool SubstanceApp::OnInit()
{

    // Create an url to access the local gcd.html
    // NOTE: this of course makes it necessary to run the program in the correct place
    wxString scheme = "vfs";
    wxFileName cwd(::wxGetCwd());
    wxString baseUrl = wxFileSystem::FileNameToURL(cwd);
    baseUrl.Replace("file:", scheme + "://");
    wxString url = baseUrl + "/index.html";

    frame = new WebFrame("");
    wxSharedPtr<wxWebViewHandler> vfs(new wxWebViewArchiveHandler(scheme));

    frame->GetWebView()->RegisterHandler(vfs);

    // create a extension instance for the SWIG generated module
    //wxSharedPtr<wxWebkitJSCExtension> redisDocStore(new wxWebkitJSCExtension(redis_docstore_initialize));

    // create the white list of URLs for that the extension will be applied
    //redisDocStore->RegisterURL(baseUrl);

    // register the extension in the browser widget
    //frame->GetWebView()->RegisterJSCExtension(redisDocStore);

    frame->GetWebView()->LoadURL(url);
    frame->Show();

    return true;
}
