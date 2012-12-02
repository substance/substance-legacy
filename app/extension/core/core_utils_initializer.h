#ifndef CORE_EXTENSION_INITIALIZER_H
#define CORE_EXTENSION_INITIALIZER_H

#include <map>
#include <string>
#include <boost/shared_ptr.hpp>

#include <JavaScriptCore/JavaScript.h>
class ResourceProvider;
typedef boost::shared_ptr<ResourceProvider> ResourceProviderPtr;

typedef std::map< std::string, ResourceProviderPtr> ProviderMap;

// singleton
class CoreInitializer
{

public:

  static CoreInitializer& instance() {
    static CoreInitializer instance;
    return instance;
  }

  static bool registerExtension(JSGlobalContextRef context);

  void addResourceProvider(const std::string &jsname, ResourceProviderPtr provider);

private:

  CoreInitializer();

  // singleton: hide copy ctor + assign op
  CoreInitializer(CoreInitializer const&) {};
  void operator=(CoreInitializer const&) {};

  ProviderMap resourceProviders;
};
#endif // CORE_EXTENSION_INITIALIZER_H
