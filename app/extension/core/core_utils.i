%module SubstanceCoreUtils

%include <std_string.i>

%{
#include <jsobjects_jsc.hpp>
#include "resource_provider.h"
%}

%include <jsobjects.i>
%include "resource_provider.h"

// only JSC supported
%{

void registerResourceProvider(ResourceProvider *provider, JSContextRef context, JSObjectRef container, const std::string& name)
{
  // wrap into js proxy
  JSValueRef proxy = SWIG_JSC_NewPointerObj(context, provider, SWIGTYPE_p_ResourceProvider, 0);

  // register into context
  JSStringRef js_name = JSStringCreateWithUTF8CString(name.c_str());
  JSObjectSetProperty(context, container,
                      js_name, proxy, kJSPropertyAttributeReadOnly, NULL);
  JSStringRelease(js_name);
}

%}
