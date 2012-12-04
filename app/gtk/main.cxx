#include <wx/wx.h>
#include <wx/webkit_jsc_extension.h>
#include <wx/webviewarchivehandler.h>
#include <wx/filesys.h>
#include <JavaScriptCore/JavaScript.h>

#include <core_utils_initializer.h>
#include "wxresourceprovider.h"

#include "mainframe.h"

extern "C" bool redis_initialize_jsobjects(JSGlobalContextRef context);

class SubstanceApp: public wxApp
{
    virtual bool OnInit();
    MainFrame *frame;
};

IMPLEMENT_APP(SubstanceApp)

bool SubstanceApp::OnInit()
{

    // Create an url to access the local gcd.html
    // NOTE: this of course makes it necessary to run the program in the correct place
    wxString scheme = "file";
    wxFileName cwd(::wxGetCwd());
    wxString baseUrl = wxFileSystem::FileNameToURL(cwd);
    baseUrl.Replace("file:", "file://");
    wxString url = baseUrl + "/index.html";

    frame = new MainFrame("");


    // create a extension instance for the SWIG generated module
    ResourceProviderPtr substanceResources(new wxResourceProvider(baseUrl));
    CoreInitializer::instance().addResourceProvider("substance.resources", substanceResources);

    wxSharedPtr<wxWebkitJSCExtension> coreUtils(new wxWebkitJSCExtension(CoreInitializer::registerExtension));
    coreUtils->RegisterURL(baseUrl);
    frame->GetWebView()->RegisterJSCExtension(coreUtils);

    wxSharedPtr<wxWebkitJSCExtension> redisDocStore(new wxWebkitJSCExtension(redis_initialize_jsobjects));
    // create the white list of URLs for that the extension will be applied
    redisDocStore->RegisterURL(baseUrl);

    // register the extension in the browser widget
    frame->GetWebView()->RegisterJSCExtension(redisDocStore);

    frame->GetWebView()->LoadURL(url);
    frame->Show();

    return true;
}
