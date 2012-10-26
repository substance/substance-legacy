#ifndef _JAVASCRIPT_H_
#define _JAVASCRIPT_H_

#include <string>
#include <vector>
#include <boost/shared_ptr.hpp>

class JSValue {

public:

  enum JSValueType {
    Object,
    Array,
    String,
    Number,
    Boolean
  };
    
  virtual std::string asString() = 0;

  virtual double asDouble() = 0;

  virtual bool asBool() = 0;

  virtual JSValueType getType() = 0;

};

typedef boost::shared_ptr<JSValue> JSValuePtr;


class JSObject {

public:

  virtual JSValuePtr get(const std::string& key) = 0;

  virtual void set(const std::string& key, JSValuePtr val) = 0;

  virtual void set(const std::string& key, const std::string& val) = 0;

  virtual void set(const std::string& key, bool val) = 0;

  virtual void set(const std::string& key, double val) = 0;

  virtual std::vector<std::string> getKeys() = 0;

};

typedef boost::shared_ptr<JSObject> JSObjectPtr;

class JSArray {

public:

  virtual unsigned int length() = 0;

  virtual JSValuePtr getAt(unsigned int index) = 0;

  virtual void setAt(unsigned int index, JSValuePtr val) = 0;

  virtual void setAt(unsigned int index, const std::string& val) = 0;

  virtual void setAt(unsigned int index, bool val) = 0;

  virtual void setAt(unsigned int index, double val) = 0;

};

typedef boost::shared_ptr<JSArray> JSArrayPtr;


class JSContext {

public:

  virtual JSValuePtr newString(const std::string& val) = 0;

  virtual JSValuePtr newBoolean(bool val) = 0;

  virtual JSValuePtr newNumber(double val) = 0;

  virtual JSObjectPtr newObject() = 0;

  virtual JSArrayPtr newArray(unsigned int length) = 0;

};

#endif
