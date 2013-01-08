#ifndef REDIS_ACCESS_HPP
#define REDIS_ACCESS_HPP

#include <jsobjects.hpp>

class RedisAccess;
class RedisList;
class RedisHash;
class RedisError;

#ifdef SWIG
#define _THROW(a) throw(a)
#else
#define _THROW(a)
#endif

//#ifndef _THROW
//#define _THROW(a)
//#endif

typedef RedisAccess* RedisAccessPtr;
typedef RedisList* RedisListPtr;
typedef RedisHash* RedisHashPtr;

class RedisAccess {

public:

  static RedisAccessPtr Create(jsobjects::JSContextPtr jscontext);

  virtual void setHost(const char* host) = 0;

  virtual void setPort(int port) = 0;

  virtual void setScope(const char* scope) = 0;

  virtual void connect() _THROW(RedisError) = 0;

  virtual void disconnect() = 0;

  virtual bool exists(const std::string &id) = 0;

  virtual std::string get(const std::string &id) _THROW(RedisError) = 0;

  virtual jsobjects::JSValuePtr getJSON(const std::string &id) = 0;

  virtual void set(const std::string &id, jsobjects::JSValuePtr val) = 0;

  // delete is C++ keyword so this needs to be renamed for JS
  virtual void remove(const std::string &prefix) = 0;

  virtual void beginTransaction() = 0;

  virtual jsobjects::JSArrayPtr executeTransaction() = 0;

  virtual void cancelTransaction() = 0;

  virtual RedisListPtr asList(const std::string &id) = 0;

  virtual RedisHashPtr asHash(const std::string &id) = 0;

};

class RedisList {

public:

  virtual unsigned int size() = 0;

  virtual void addAsString(const std::string &val) = 0;

  virtual std::string get(unsigned int index = 0) _THROW(RedisError) = 0;

  virtual void add(jsobjects::JSValuePtr val) = 0;

  virtual jsobjects::JSValuePtr getJSON(unsigned int index) _THROW(RedisError) = 0;

  virtual jsobjects::JSArrayPtr asArray() = 0;
};

class RedisHash {

public:

  virtual bool contains(const std::string& key) = 0;

  virtual jsobjects::JSArrayPtr getKeys() = 0;

  virtual jsobjects::JSArrayPtr getValues() = 0;

  virtual std::string get(const std::string& key) _THROW(RedisError) = 0;

  virtual jsobjects::JSValuePtr getJSON(const std::string& key) = 0;

  //virtual void set(const std::string& key, const std::string& val) = 0;

  virtual void set(const std::string& key, jsobjects::JSValuePtr val) = 0;

  virtual void remove(const std::string& key) = 0;

};

#endif // REDIS_ACCESS_HPP
