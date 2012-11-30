/*
 * TODOS (26.11.2012):
 *  - re-activate the test suite
 *  - add typemaps for jsobjects
 *  - add javascript tests (CLI)
 *  - integrate into browser version
 */

#include <hiredis.h>
#include <stdio.h>
#include <stdarg.h>
#include <string.h>

#include <iostream>
#include <string>

#include "redis_error.hpp"
#include "hiredis_access.hpp"

#define REDIS_TRUE 1
#define REDIS_FALSE 0

#define BUFFER_LEN 1024


HiRedisAccess::HiRedisAccess(JSContextPtr jscontext) : jscontext(jscontext) { }

HiRedisAccess::~HiRedisAccess() {
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

 void HiRedisAccess::setHost(const char* host) {
  hostUrl = host;
}

 void HiRedisAccess::setPort(int port) {
  this->port = port;
}

 void HiRedisAccess::setScope(const char* scope) {
  this->scope = scope;
  createCommands();
}

 void HiRedisAccess::connect() {
  redis = redisConnect(hostUrl, port);
  if (redis->err) {
    throw RedisError("Connection error: %s\n", redis->errstr);
  }
}

 void HiRedisAccess::disconnect() {
  runCommand("QUIT");
}

 bool HiRedisAccess::exists(const std::string &id) {
  ReplyPtr reply = runCommand(commands[EXISTS], id.c_str());
  return (reply->integer == REDIS_TRUE)? true : false;
}

 std::string HiRedisAccess::get(const std::string &id) {
  ReplyPtr reply = runCommand(commands[GET_STRING_VALUE], id.c_str());
  return reply->str;
}

 void HiRedisAccess::set(const std::string &id, const std::string &val) {
  runCommand(commands[SET_STRING_VALUE], id.c_str(), val.c_str());
}

 void HiRedisAccess::remove(const std::string &prefix) {
  ReplyPtr reply = runCommand("KEYS %s*", prefix.c_str());

  runCommand("MULTI");
  for(size_t idx = 0; idx < reply->elements; ++idx) {
    appendCommand("DEL %s", reply->element[idx]->str);
  }
  appendCommand("EXEC");
  reply = getReply();
  // TODO check if ok
}

 void HiRedisAccess::beginTransaction() {
  runCommand("MULTI");
}

 void HiRedisAccess::cancelTransaction() {
  runCommand("DISCARD");
}

 JSArrayPtr HiRedisAccess::executeTransaction() {
  ReplyPtr reply = runCommand("EXEC");
  JSArrayPtr result = createArray(reply.get());
  return result;
}

 RedisListPtr HiRedisAccess::asList(const std::string& id) {
  return RedisListPtr();
}

ReplyPtr HiRedisAccess::runCommand(const std::string& cmd) {
  redisReply *_reply = (redisReply*) redisCommand(redis, cmd.c_str());
  ReplyPtr reply = wrapReply((void*) _reply);
  return reply;
}

ReplyPtr HiRedisAccess::runCommand(const char* format, ...) {
  va_list ap;
  va_start(ap, format);
  ReplyPtr reply = wrapReply(redisCommand(redis, format, ap));
  va_end(ap);
  return reply;
}

void HiRedisAccess::appendCommand(const char* format, ...) {
  va_list ap;
  va_start(ap, format);
  redisAppendCommand(redis, format, ap);
  va_end(ap);
}

ReplyPtr HiRedisAccess::getReply() {
  redisReply *reply;
  redisGetReply(redis, (void**) &reply);
  return wrapReply(reply);
}

JSArrayPtr HiRedisAccess::createArray(redisReply* reply) {
  JSArrayPtr result = jscontext->newArray(reply->elements);
  for(size_t idx = 0; idx < reply->elements; ++idx) {
    switch(reply->element[idx]->type) {
      case REDIS_REPLY_STRING:
        result->setAt(idx, jscontext->newString(reply->str));
        break;
      case REDIS_REPLY_ARRAY:
        result->setAt(idx, createArray(reply->element[idx]));
        break;
      case REDIS_REPLY_INTEGER:
        result->setAt(idx, jscontext->newNumber(reply->integer));
        break;
    }
  }

  return result;
}

ReplyPtr HiRedisAccess::wrapReply(void *ptr) {
  return ReplyPtr((redisReply*) ptr, freeReplyObject);
}

ReplyPtr HiRedisAccess::wrapReply(redisReply *ptr) {
  return ReplyPtr(ptr, freeReplyObject);
}

void HiRedisAccess::createCommands() {
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
      case DISCONNECT:
        len = snprintf(buf, BUFFER_LEN, "QUIT");
        break;
    }
    char *str = new char[len+1];
    strncpy(str, buf, len+1);
    commands[idx] = str;
  }
}

/*static*/ RedisAccessPtr RedisAccess::Create(JSContextPtr jscontext) {
  return RedisAccessPtr(new HiRedisAccess(jscontext));
}

unsigned int HiRedisList::size() {
  ReplyPtr reply = redis.runCommand(commands[LENGTH]);
  return reply->integer;
}

void HiRedisList::add(const std::string &val) {
  redis.runCommand(commands[PUSH], val.c_str());
}

std::string HiRedisList::get(unsigned int index) {
  ReplyPtr reply = redis.runCommand(commands[GET], index);
  return reply->str;
}

JSArrayPtr HiRedisList::asArray() {
  ReplyPtr reply = redis.runCommand(commands[GET_ALL]);
  return redis.createArray(reply.get());
}

void HiRedisList::createCommands() {
  char buf[BUFFER_LEN];
  int len;
  for(size_t idx = 0; idx < COMMANDS_MAX; ++idx) {
    switch (idx) {
      case LENGTH:
        len = snprintf(buf, BUFFER_LEN, "LLEN %s", key.c_str());
        break;
      case PUSH:
        len = snprintf(buf, BUFFER_LEN, "LPUSH %s %%s", key.c_str());
        break;
      case GET:
        len = snprintf(buf, BUFFER_LEN, "LGET %s %%d", key.c_str());
        break;
      case GET_ALL:
        len = snprintf(buf, BUFFER_LEN, "LRANGE 0 -1");
        break;
    }
    char *str = new char[len+1];
    strncpy(str, buf, len+1);
    commands[idx] = str;
  }
}
