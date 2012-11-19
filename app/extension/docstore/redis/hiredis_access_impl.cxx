/*
 * TODOS (15.11.2012):
 *  - include jsobjects project as external project
 *  - fix compile errors
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

class HiRedisAccess: public RedisAccess {

public:
  
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
    return "";
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
    // TODO: transform the reply into a Javascript array
    return JSArrayPtr();
  }

  virtual RedisListPtr asList(const std::string& id) {
    return RedisListPtr();
  }

protected:

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

  ReplyPtr wrapReply(void *ptr) {
    return ReplyPtr((redisReply*) ptr, freeReplyObject);
  }

  ReplyPtr wrapReply(redisReply *ptr) {
    return ReplyPtr(ptr, freeReplyObject);
  }

  void createCommands()
  {
    char buf[BUFFER_LEN];
    int len;
    for(size_t idx = 0; idx < COMMANDS_MAX; ++idx) {
      switch (idx) {
        case EXISTS:
          len = snprintf(buf, BUFFER_LEN, "EXISTS %s:%%s", scope);
          break;
        case SET_STRING_VALUE:
          len = snprintf(buf, BUFFER_LEN, "SET %s:%%s %%s", scope);
          break;
        case SET_INT_VALUE:
          len = snprintf(buf, BUFFER_LEN, "SET %s:%%s %%s %%d", scope);
          break;
        case SET_FLOAT_VALUE:
          len = snprintf(buf, BUFFER_LEN, "SET %s:%%s %%s %%f", scope);
          break;
      }
      char *str = new char[len+1];
      strncpy(str, buf, len+1);
      commands[idx] = str;
    }
  }

private:
  redisContext *redis;

  enum COMMANDS {
    SCOPE = 0,
    EXISTS,
    SET_STRING_VALUE,
    SET_INT_VALUE,
    SET_FLOAT_VALUE,
    COMMANDS_MAX
  };
  
  const char* hostUrl;
  int port;
  const char* scope;
  const char* commands[COMMANDS_MAX];
};

/*static*/ RedisAccess* RedisAccess::Create() {
  return new HiRedisAccess();
}
