#ifndef HIREDIS_ACCESS_HPP
#define HIREDIS_ACCESS_HPP

#include <boost/shared_ptr.hpp>
#include "redis_access.hpp"

struct redisReply;
struct redisContext;
typedef boost::shared_ptr<redisReply> ReplyPtr;

class HiRedisAccess;

class HiRedisList: public RedisList {
  enum COMMANDS {
    LENGTH,
    PUSH,
    GET,
    GET_ALL,
    DELETE,
    COMMANDS_MAX
  };

public:
  HiRedisList(HiRedisAccess &redis, const std::string& key);

  virtual unsigned int size();

  virtual void addAsString(const std::string &val);

  virtual std::string get(unsigned int index);

  virtual void add(jsobjects::JSValuePtr val);

  virtual void remove(unsigned int index);

  virtual jsobjects::JSValuePtr getJSON(unsigned int index);

  virtual jsobjects::JSArrayPtr asArray();

protected:

  void createCommands();

  HiRedisAccess &redis;
  std::string key;

  const char* commands[COMMANDS_MAX];

#ifdef TESTING
  friend class HiRedisTestAccess;
#endif
};

class HiRedisHash: public RedisHash {
  enum COMMANDS {
    CONTAINS,
    KEYS,
    VALUES,
    GET,
    SET,
    REMOVE,
    COMMANDS_MAX
  };

public:
  HiRedisHash(HiRedisAccess &redis, const std::string& key);

  virtual bool contains(const std::string& key);

  virtual jsobjects::JSArrayPtr getKeys();

  virtual jsobjects::JSArrayPtr getValues();

  virtual std::string get(const std::string& key);

  virtual jsobjects::JSValuePtr getJSON(const std::string& key);

  //virtual void set(const std::string& key, const std::string& val);

  virtual void set(const std::string& key, jsobjects::JSValuePtr val);

  virtual void remove(const std::string& key);

protected:

  void createCommands();

  HiRedisAccess &redis;
  std::string key;

  const char* commands[COMMANDS_MAX];

};

class HiRedisAccess: public RedisAccess {

enum COMMANDS {
  EXISTS = 0,
  DELETE,
  KEYS,
  GET_STRING_VALUE,
  SET_STRING_VALUE,
  DISCONNECT,
  COMMANDS_MAX
};

public:

  HiRedisAccess(jsobjects::JSContextPtr context);

  virtual ~HiRedisAccess();

  virtual void setHost(const char* host);

  virtual void setPort(int port);

  virtual void setScope(const char* scope);

  virtual void connect();

  virtual void disconnect();

  virtual bool exists(const std::string &id);

  virtual std::string get(const std::string &id);

  virtual jsobjects::JSValuePtr getJSON(const std::string &id);

  virtual void set(const std::string &id, jsobjects::JSValuePtr obj);

  virtual void setString(const std::string &id, const std::string &value);

  virtual void remove(const std::string &key);

  virtual void removeWithPrefix(const std::string &prefix);

  virtual void beginTransaction();

  virtual void cancelTransaction();

  virtual jsobjects::JSArrayPtr executeTransaction();

  virtual RedisListPtr asList(const std::string& id);

  virtual RedisHashPtr asHash(const std::string &id);

  ReplyPtr runCommand(const std::string& cmd);

  void appendCommand(const std::string& cmd);

  ReplyPtr getReply();

  jsobjects::JSArrayPtr createArray(redisReply* reply);

  ReplyPtr wrapReply(void *ptr);

  ReplyPtr wrapReply(redisReply *ptr);

  void createCommands();

private:
  jsobjects::JSContextPtr jscontext;
  redisContext *redis;

  std::string hostUrl;
  int port;
  std::string scope;
  const char* commands[COMMANDS_MAX];

#ifdef TESTING
  friend class HiRedisTestAccess;
#endif
  friend class HiRedisList;
  friend class HiRedisHash;

};

#endif // HIREDIS_ACCESS_HPP
