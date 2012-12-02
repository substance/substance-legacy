#include <wx/sstream.h>

#include "wxresourceprovider.h"

wxResourceProvider::wxResourceProvider(const wxString& basePath) {
  filesys = wxSharedPtr<wxFileSystem>(new wxFileSystem());
  filesys->ChangePathTo(basePath);
}
  
std::string wxResourceProvider::get(const std::string &localUrl)
{
  wxStringOutputStream os;
  wxSharedPtr<wxFSFile> file(filesys->OpenFile(localUrl));
  if(file.get() == 0) return "undefined";
  
  file->GetStream()->Read(os);
  
  // Todo: there is probably lots of copying going on here
  return os.GetString().ToStdString();
}

JSValuePtr wxResourceProvider::getJSON(const std::string &localUrl) {
  const std::string& data(get(localUrl));
  return context->fromJson(data);
}
