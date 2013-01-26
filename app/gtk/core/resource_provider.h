#ifndef RESOURCE_PROVIDER_H
#define RESOURCE_PROVIDER_H

#include <jsobjects.hpp>
using namespace jsobjects;

class ResourceProvider {

protected:

  ResourceProvider() {}

  virtual ~ResourceProvider() {}

public:

  void setContext(JSContextPtr _context) { context = _context; }

  virtual std::string get(const std::string &localUrl) = 0;

  virtual JSValuePtr getJSON(const std::string &localUrl) = 0;

protected:

  JSContextPtr context;
};

#endif // RESOURCE_HANDLER_H
