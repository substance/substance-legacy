/*
 * TODOS (26.11.2012):
 *  - implement remaining methods
 *  - re-activate the test suite
 *  - swig first run
 *  - add mappings for jsobjects
 *  - add javascript tests (CLI)
 *  - integrate into browser version
 *  - meet mike
 */

#include <hiredis.h>
#include <stdio.h>
#include <stdarg.h>
#include <string.h>

#include <iostream>
#include <boost/shared_ptr.hpp>

#include "redis_access.hpp"
#include "redis_error.hpp"

#define REDIS_TRUE 1
#define REDIS_FALSE 0

#define BUFFER_LEN 1024

typedef boost::shared_ptr<redisReply> ReplyPtr;

class HiRedisAccess;

class HiRedisList: public RedisList {
  enum COMMANDS {
    LENGTH,
    PUSH,
    GET,
    COMMANDS_MAX
  };

public:
  HiRedisAccess(HiRedisAccess &redis, const std::string& key): redis(redis), key(key) { }

  virtual unsigned int size();

  virtual void add(std::string val);

  virtual std::string getLast();

  virtual JSArrayPtr asArray();

protected:

  void createCommands();

  HiRedisAccess &redis;

  std::string key;

};

class HiRedisAccess: public RedisAccess {

enum COMMANDS {
  SCOPE = 0,
  EXISTS,
  GET_STRING_VALUE,
  SET_STRING_VALUE,
  COMMANDS_MAX
};

public:

  HiRedisAccess(JSContextPtr jscontext) : jscontext(jscontext) { }

  virtual ~HiRedisAccess() {
    if(redis != 0) {
      redisFree(redis);
      redis->flags = 0;
      redis = 0;
    }
    for(size_t idx = 0; idx < COMMANDS_MAX; ++idx) {
      if(commands[idx]) {
        delete[] commands[idx];
      }
    }
  }

  virtual void setHost(const char* host) {
    hostUrl = host;
  }

  virtual void setPort(int port) {
    this->port = port;
  }

  virtual void setScope(const char* scope) {
    this->scope = scope;
    createCommands();
  }

  virtual void connect() {
    redis = redisConnect(hostUrl, port);
    if (redis->err) {
      throw RedisError("Connection error: %s\n", redis->errstr);
    }
  }

  virtual void disconnect() {
    //TODO: implement
  }

  virtual bool exists(const std::string &id) {
    ReplyPtr reply = runCommand(commands[EXISTS], id.c_str());
    return (reply->integer == REDIS_TRUE)? true : false;
  }

  virtual std::string get(const std::string &id) {
    ReplyPtr reply = runCommand(commands[GET_STRING_VALUE], id.c_str());
    return reply->str;
  }

  virtual void set(const std::string &id, const std::string &val) {
    runCommand(commands[SET_STRING_VALUE], id.c_str(), val.c_str());
  }

  virtual void remove(const std::string &prefix) {
    ReplyPtr reply = runCommand("KEYS %s*", prefix.c_str());

    runCommand("MULTI");
    for(size_t idx = 0; idx < reply->elements; ++idx) {
      appendCommand("DEL %s", reply->element[idx]->str);
    }
    appendCommand("EXEC");
    reply = getReply();
    // TODO check if ok
  }

  virtual void beginTransaction() {
    runCommand("MULTI");
  }

  virtual void cancelTransaction() {
    runCommand("DISCARD");
  }

  virtual JSArrayPtr executeTransaction() {
    ReplyPtr reply = runCommand("EXEC");
    JSArrayPtr result = createArray(reply.get());
    return result;
  }

  virtual RedisListPtr asList(const std::string& id) {
    return RedisListPtr();
  }

  ReplyPtr runCommand(const std::string& cmd) {
    redisReply *_reply = (redisReply*) redisCommand(redis, cmd.c_str());
    ReplyPtr reply = wrapReply((void*) _reply);
    return reply;
  }

  ReplyPtr runCommand(const char* format, ...) {
    va_list ap;
    va_start(ap, format);
    ReplyPtr reply = wrapReply(redisCommand(redis, format, ap));
    va_end(ap);
    return reply;
  }

  void appendCommand(const char* format, ...) {
    va_list ap;
    va_start(ap, format);
    redisAppendCommand(redis, format, ap);
    va_end(ap);
  }

  ReplyPtr getReply() {
    redisReply *reply;
    redisGetReply(redis, (void**) &reply);
    return wrapReply(reply);
  }

protected:

  ReplyPtr wrapReply(void *ptr) {
    return ReplyPtr((redisReply*) ptr, freeReplyObject);
  }

  ReplyPtr wrapReply(redisReply *ptr) {
    return ReplyPtr(ptr, freeReplyObject);
  }

  JSArrayPtr createArray(redisReply* reply) {
    JSArrayPtr result = jscontext->newArray(reply->elements);
    for(size_t idx = 0; idx < reply->elements; ++idx) {
      switch(reply->element[idx]->type) {
        case REDIS_REPLY_STRING:
          result->setAt(idx, jscontext->newString(reply->str));
          break;
        case REDIS_REPLY_ARRAY:
          result->setAt(idx, createArray(reply->element[idx]));
          break;
        case REDIS_REPLY_INT:
          result->setAt(idx, jscontext->newNumber(reply->integer));
          break;
      }
    }
  }

  void createCommands() {
    char buf[BUFFER_LEN];
    int len;
    for(size_t idx = 0; idx < COMMANDS_MAX; ++idx) {
      switch (idx) {
        case EXISTS:
          len = snprintf(buf, BUFFER_LEN, "EXISTS %s:%%s", scope);
          break;
        case GET_STRING_VALUE:
          len = snprintf(buf, BUFFER_LEN, "GET %s:%%s", scope);
          break;
        case SET_STRING_VALUE:
          len = snprintf(buf, BUFFER_LEN, "SET %s:%%s %%s", scope);
          break;
      }
      char *str = new char[len+1];
      strncpy(str, buf, len+1);
      commands[idx] = str;
    }
  }

private:
  JSContextPtr jscontext;
  redisContext *redis;

  const char* hostUrl;
  int port;
  const char* scope;
  const char* commands[COMMANDS_MAX];
};

/*static*/ RedisAccessPtr RedisAccess::Create() {
  return RedisAccessPtr(new HiRedisAccess());
}
‚
unsigned int HiRedisList::size() {
  ReplyPtr reply = redis.runCommand(commands[LENGTH])
  return reply->integer;
}

void HiRedisList::add(const std::string &val) {
  redis.runCommand(commands[PUSH], val);
}

std::string HiRedisList::get(unsigned int index = 0) {
  redis.runCommand(commands[GET], index);
}

JSArrayPtr HiRedisList::asArray() {

}

void HiRedisList::createCommands() {
  char buf[BUFFER_LEN];
  int len;
  for(size_t idx = 0; idx < COMMANDS_MAX; ++idx) {
    switch (idx) {
      case LENGTH:
        len = snprintf(buf, BUFFER_LEN, "LLEN %s", key);
        break;
      case PUSH:
        len = snprintf(buf, BUFFER_LEN, "LPUSH %s %%s", key);
        break;
      case GET:
        len = snprintf(buf, BUFFER_LEN, "LGET %s %%d", key);
        break;
    }
    char *str = new char[len+1];
    strncpy(str, buf, len+1);
    commands[idx] = str;
  }
}
