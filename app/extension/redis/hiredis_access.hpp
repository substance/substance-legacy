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
    COMMANDS_MAX
  };

public:
  HiRedisList(HiRedisAccess &redis, const std::string& key): redis(redis), key(key) { }

  virtual unsigned int size();

  virtual void add(const std::string &val);

  virtual std::string get(unsigned int index);

  virtual JSArrayPtr asArray();

protected:

  void createCommands();

  HiRedisAccess &redis;
  std::string key;

  const char* commands[COMMANDS_MAX];

#ifdef TESTING
  friend class HiRedisTestAccess;
#endif
};

class HiRedisAccess: public RedisAccess {

enum COMMANDS {
  EXISTS = 0,
  GET_STRING_VALUE,
  SET_STRING_VALUE,
  DISCONNECT,
  COMMANDS_MAX
};

public:

  HiRedisAccess(JSContextPtr jscontext);

  virtual ~HiRedisAccess();

  virtual void setHost(const char* host);

  virtual void setPort(int port);

  virtual void setScope(const char* scope);

  virtual void connect();

  virtual void disconnect();

  virtual bool exists(const std::string &id);

  virtual std::string get(const std::string &id);

  virtual void set(const std::string &id, const std::string &val);

  virtual void remove(const std::string &prefix);

  virtual void beginTransaction();

  virtual void cancelTransaction();

  virtual JSArrayPtr executeTransaction();

  virtual RedisListPtr asList(const std::string& id);

  ReplyPtr runCommand(const std::string& cmd);

  ReplyPtr runCommand(const char* format, ...);

  void appendCommand(const char* format, ...);

  ReplyPtr getReply();

  JSArrayPtr createArray(redisReply* reply);

  ReplyPtr wrapReply(void *ptr);

  ReplyPtr wrapReply(redisReply *ptr);

  void createCommands();

private:
  JSContextPtr jscontext;
  redisContext *redis;

  const char* hostUrl;
  int port;
  const char* scope;
  const char* commands[COMMANDS_MAX];

#ifdef TESTING
  friend class HiRedisTestAccess;
#endif

};

#endif // HIREDIS_ACCESS_HPP
