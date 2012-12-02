#ifndef RESOURCE_PROVIDER_H
#define RESOURCE_PROVIDER_H

class ResourceProvider {

protected:

  ResourceProvider(JSContextPtr context) : context(context) {}
  
  virtual ~ResourceProvider() {}

public:  

  virtual std::string get(const std::string localUrl) =0; // { return ""; } // = 0;

  virtual JSObjectPtr getJSON(const std::string localUrl) =0; //{ return JSObjectPtr(NULL);} // = 0;

protected:
  
  JSContextPtr context;
};

#endif // RESOURCE_HANDLER_H
