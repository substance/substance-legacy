#ifndef WX_RESOURCE_PROVIDER_H
#define WX_RESOURCE_PROVIDER_H

#include <wx/sharedptr.h>
#include <wx/filesys.h>
#include <resource_provider.h>

class wxResourceProvider: public ResourceProvider {

public:

  wxResourceProvider(const wxString& basePath);
  
  virtual std::string get(const std::string &localUrl);

  virtual JSValuePtr getJSON(const std::string &localUrl);  
  
private:
  
  wxSharedPtr<wxFileSystem> filesys;
};

#endif // WX_RESOURCE_PROVIDER_H
