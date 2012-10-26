#include "jsobjects.h"

#include <JavaScriptCore/JavaScript.h>
#include <assert.h>

class JSValueJSC: public JSValue {

public:

  JSValueJSC(JSContextRef context, JSValueRef val): context(context) {
    
    if(JSValueIsBoolean(context, val)) {
      type = Boolean;
    } else if(JSValueIsNumber(context, val)) {
      type = Number;
    } else if(JSValueIsString(context, val)) {
      type = String;
    } else if(JSValueIsObject(context, val)) {
      type = Object;
    } else {
      throw "Not yet supported";
    }
    
    JSValueProtect(context, val);
    value = val;
  }
  
  ~JSValueJSC() {
    JSValueUnprotect(context, value);
  }
  
  virtual std::string asString() {
    assert(JSValueIsString(context, value));
    
    JSStringRef jsstring = JSValueToStringCopy(context, value, /* JSValueRef *exception */ 0);
    unsigned int length = JSStringGetLength(jsstring);
    char *cstr = new char[length+1];
    JSStringGetUTF8CString(jsstring, cstr, length);
    std::string result(cstr);

    JSStringRelease(jsstring);    
    delete[] cstr;

    return result;
  }

  virtual double asDouble() {
    assert(JSValueIsNumber(context, value));
    return JSValueToNumber(context, value, /* JSValueRef *exception */ 0); 
  }

  virtual bool asBool() {
    assert(JSValueIsBoolean(context, value));
    return JSValueToBoolean(context, value); 
  }

  virtual JSValueType getType() { return type; };


  JSContextRef context;
  JSValueRef value;

protected:
  JSValueType type;
  
};

class JSObjectJSC: public JSValueJSC, public JSObject {

public:
  JSObjectJSC(JSContextRef context, JSObjectRef obj): JSValueJSC(context, obj), object(obj) {}

  virtual JSValuePtr get(const std::string& key) {
    JSStringRef jskey = JSStringCreateWithUTF8CString(key.c_str());
    JSValueRef val = JSObjectGetProperty(context, object, jskey, /* JSValueRef *exception */ 0);
    JSStringRelease(jskey);
    return JSValuePtr(new JSValueJSC(context, val));
  }

  virtual void set(const std::string& key, JSValuePtr val) {
    JSStringRef jskey = JSStringCreateWithUTF8CString(key.c_str());
    JSObjectSetProperty(context, object, jskey, static_cast<JSValueJSC*>(val.get())->value, kJSPropertyAttributeNone, /* JSValueRef *exception */ 0);
    JSStringRelease(jskey);
  }

  virtual void set(const std::string& key, const std::string& val) {
    JSStringRef jskey = JSStringCreateWithUTF8CString(key.c_str());
    JSStringRef jsval = JSStringCreateWithUTF8CString(val.c_str());
    JSObjectSetProperty(context, object, jskey, JSValueMakeString(context, jsval), kJSPropertyAttributeNone, /* JSValueRef *exception */ 0);
    JSStringRelease(jskey);
  }

  virtual void set(const std::string& key, bool val) {
    JSStringRef jskey = JSStringCreateWithUTF8CString(key.c_str());
    JSObjectSetProperty(context, object, jskey, JSValueMakeBoolean(context, val), kJSPropertyAttributeNone, /* JSValueRef *exception */ 0);
    JSStringRelease(jskey);
  }

  virtual void set(const std::string& key, double val) {
    JSStringRef jskey = JSStringCreateWithUTF8CString(key.c_str());
    JSObjectSetProperty(context, object, jskey, JSValueMakeNumber(context, val), kJSPropertyAttributeNone, /* JSValueRef *exception */ 0);
    JSStringRelease(jskey);
  }

protected:
  JSObjectRef object;  
};

class JSArrayJSC: public JSObjectJSC, public JSArray {
  
public:

  JSArrayJSC(JSContextRef context, JSObjectRef arr): JSObjectJSC(context, arr) {
  }

  virtual JSValuePtr getAt(unsigned int index) {
    return JSValuePtr(new JSValueJSC(context, JSObjectGetPropertyAtIndex(context, object, index, /* JSValueRef *exception */ 0)));
  }

  virtual void setAt(unsigned int index, JSValuePtr val) {
    JSObjectSetPropertyAtIndex(context, object, index, static_cast<JSValueJSC*>(val.get())->value, /* JSValueRef *exception */ 0);
  };

  virtual void setAt(unsigned int index, const std::string& val) {
    JSStringRef jsval = JSStringCreateWithUTF8CString(val.c_str());
    JSObjectSetPropertyAtIndex(context, object, index, JSValueMakeString(context, jsval), /* JSValueRef *exception */ 0);
  }

  virtual void setAt(unsigned int index, bool val) {
    JSObjectSetPropertyAtIndex(context, object, index, JSValueMakeBoolean(context, val), /* JSValueRef *exception */ 0);
  }

  virtual void setAt(unsigned int index, double val) {
    JSObjectSetPropertyAtIndex(context, object, index, JSValueMakeNumber(context, val), /* JSValueRef *exception */ 0);
  }

  virtual unsigned int length() {
    JSPropertyNameArrayRef names = JSObjectCopyPropertyNames(context, object);
    unsigned int length = JSPropertyNameArrayGetCount(names);
    JSPropertyNameArrayRelease(names);
    return length;
  }
};
