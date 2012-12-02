#include <boost/algorithm/string.hpp>
#include <boost/shared_ptr.hpp>

#define USE_BOOST_SHARED_PTR 1
#include "resource_provider.h"
#include <jsobjects_jsc.hpp>
#undef USE_BOOST_SHARED_PTR

#include "core_utils_initializer.h"

/*
 * TODO
- solve the problems with including jsobjects
- requirements:
  - header only
  - no strange compilation problems
  - shared_ptrs are primary
  - currently:
    - some methods are static and implemented in a cxx
      which makes using the library more complicated...
    - maybe get rid of the static implementations
*/

extern void registerResourceProvider(ResourceProvider *provider, JSContextRef context, JSObjectRef container, const std::string& name);
extern "C" bool SubstanceCoreUtils_initialize(JSGlobalContextRef context);

typedef std::vector<std::string> StringVector;

CoreInitializer::CoreInitializer()
{
}

/*static*/
bool CoreInitializer::registerExtension(JSGlobalContextRef context)
{
  SubstanceCoreUtils_initialize(context);

  CoreInitializer &initializer = CoreInitializer::instance();
  JSContextPtr jscontext(new JSContextJSC(context));
  JSObjectPtr global(new JSObjectJSC(context, JSContextGetGlobalObject(context)));

  for (ProviderMap::const_iterator it = initializer.resourceProviders.begin();
       it != initializer.resourceProviders.end(); ++it) {

    // prepare namespace objects, i.e., the given id is split by '.'
    // and if not
    StringVector ids;
    boost::split(ids, it->first, boost::is_any_of("."));

    JSObjectPtr current = global;
    for (StringVector::const_iterator it2 = ids.begin(); it2 != ids.end()-1; ++it2) {

      if (current->get(*it2)->isUndefined()) {

	// use jsobjects api to create and store a new namespace object
	JSObjectPtr next = jscontext->newObject();
	current->set(*it2, next);
	current = next;

      } else {

	// TODO: more verbose error handling
	return false;
      }
    }

    // register a proxy for ResourceProvider*
    it->second->setContext(jscontext);
    registerResourceProvider(it->second.get(), context, dynamic_cast<JSObjectJSC*>(current.get())->object, *(ids.end()-1));
  }

  return true;
}

void CoreInitializer::addResourceProvider(const std::string &jsname, ResourceProviderPtr provider)
{
  resourceProviders[jsname] = provider;
}
