#include "jsobjects.h"

#include <v8.h>
#include <assert.h>
#include <iostream>

std::string JSValueV8_toString(const v8::Handle<v8::Value> val) {
    assert(val->IsString());
  v8::Handle<v8::String> jsstring = val->ToString();
  char *cstr = new char[jsstring->Utf8Length()];
  jsstring->WriteUtf8(cstr);
  std::string result(cstr);
  delete[] cstr;
  return result;
}

v8::Handle<v8::String> JSValueV8_fromString(const std::string& s) {
   return v8::String::New(s.c_str());
}

class JSValueV8: public JSValue {

public:

  JSValueV8(v8::Handle<v8::Value> val) {

    if(val->IsArray()) {
      type = Array;
    } else if(val->IsBoolean()) {
      type = Boolean;
    } else if(val->IsNumber()) {
      type = Number;
    } else if(val->IsString()) {
      type = String;
    } else if(val->IsObject()) {
      type = Object;
    } else {
      throw "Not yet supported";
    }

    value = v8::Persistent<v8::Value>::New(val);
  }

  ~JSValueV8() {
    value.Dispose();
  }

  virtual std::string asString() {
    return JSValueV8_toString(value);
  }

  virtual double asDouble() {
    assert(value->IsNumber());
    return value->NumberValue();
  }

  virtual bool asBool() {
    assert(value->IsBoolean());
    return value->BooleanValue();
  }

  virtual JSValueType getType() { return type; }

public:

  v8::Persistent<v8::Value> value;

protected:

  JSValueType type;

};

class JSObjectV8: public JSObject, public JSValueV8 {

public:
  JSObjectV8(v8::Handle<v8::Object> obj): JSValueV8(obj), object(obj) {}

  virtual JSValuePtr get(const std::string& key) {
    return JSValuePtr(new JSValueV8(object->Get(v8::String::New(key.c_str()))));
  }

  virtual void set(const std::string& key, JSValuePtr val) {
    object->Set(v8::String::New(key.c_str()), static_cast<JSValueV8*>(val.get())->value);
  }

  virtual void set(const std::string& key, const std::string& val) {
    object->Set(v8::String::New(key.c_str()), v8::String::New(val.c_str()));
  }

  virtual void set(const std::string& key, bool val) {
    object->Set(v8::String::New(key.c_str()), v8::Boolean::New(val));
  }

  virtual void set(const std::string& key, double val) {
    object->Set(v8::String::New(key.c_str()), v8::Number::New(val));
  }

  virtual std::vector<std::string> getKeys() {
    std::vector<std::string> keys;
    v8::Handle<v8::Array> arr = object->GetPropertyNames();
    keys.reserve(arr->Length());
    for(size_t i = 0; i<arr->Length(); ++i) {
      keys.push_back(JSValueV8_toString(arr->Get(i)->ToString()));
    }
  }

protected:
  v8::Handle<v8::Object> object;
};

class JSArrayV8: public JSObjectV8, public JSArray {

public:

  JSArrayV8(v8::Handle<v8::Array> arr): JSObjectV8(arr), array(arr) {}

  virtual ~JSArrayV8() {
    std::cout << "bla" << std::endl;
  }

  virtual JSValuePtr getAt(unsigned int index) {
    return JSValuePtr(new JSValueV8(array->Get(index)));
  }

  virtual void setAt(unsigned int index, JSValuePtr val) {
    array->Set(index, static_cast<JSValueV8*>(val.get())->value);
  };

  virtual void setAt(unsigned int index, const std::string& val) {
    array->Set(index, v8::String::New(val.c_str()));
  }

  virtual void setAt(unsigned int index, bool val) {
    array->Set(index, v8::Boolean::New(val));
  }

  virtual void setAt(unsigned int index, double val) {
    array->Set(index, v8::Number::New(val));
  }

  virtual unsigned int length() {
    return array->Length();
  }

protected:
  v8::Handle<v8::Array> array;
};

class JSContextV8: public JSContext {

  virtual JSArrayPtr newArray(unsigned int length) {
    v8::Handle<v8::Array> arr = v8::Array::New(length);
    return JSArrayPtr(new JSArrayV8(arr));
  }
  
  virtual JSValuePtr newBoolean(bool val) {
    return JSValuePtr(new JSValueV8(v8::Boolean::New(val)));
  }
  
  virtual JSValuePtr newNumber(double val) {
    return JSValuePtr(new JSValueV8(v8::Number::New(val)));
  }
  
  virtual JSObjectPtr newObject() {
    return JSObjectPtr(new JSObjectV8(v8::Object::New()));
  }
  
  virtual JSValuePtr newString(const std::string& val) {
    return JSValuePtr(new JSValueV8(JSValueV8_fromString(val)));
  }
};

JSValuePtr CreateJSValueV8(v8::Handle<v8::Value> val) {
  return JSValuePtr(new JSValueV8(val));
}

JSObjectPtr CreateJSObjectV8(v8::Handle<v8::Object> obj) {
  return JSObjectPtr(new JSObjectV8(obj));
}

JSArrayPtr CreateJSArrayV8(v8::Handle<v8::Array> arr) {
  return JSArrayPtr(new JSArrayV8(arr));
}
