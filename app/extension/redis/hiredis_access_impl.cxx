/*
 * TODOS (26.11.2012):
 *  - re-activate the test suite
 *  - add javascript tests (CLI)
 */

#include <hiredis.h>
#include <stdio.h>
#include <stdarg.h>
#include <string.h>

#include <iostream>
#include <string>
#include <boost/format.hpp>
using boost::format;
using boost::str;

#include "redis_error.hpp"
#include "hiredis_access.hpp"

#define REDIS_TRUE 1
#define REDIS_FALSE 0

#define BUFFER_LEN 1024

HiRedisAccess::HiRedisAccess(jsobjects::JSContextPtr jscontext)
  : jscontext(jscontext),hostUrl("127.0.0.1"), port(6379), scope("")
{
  createCommands();
}

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
  this->scope = std::string(scope);
  createCommands();
}

void HiRedisAccess::connect() {
  //redis = redisConnect(hostUrl.c_str(), port);
  redis = redisConnectUnix("/tmp/substance.sock");
  if (redis->err) {
    throw RedisError("Connection error: %s\n", redis->errstr);
  }
}

void HiRedisAccess::disconnect() {
  runCommand("QUIT");
}

bool HiRedisAccess::exists(const std::string &id) {
  ReplyPtr reply((redisReply*) redisCommand(redis, commands[EXISTS], id.c_str()));
  return (reply->integer == REDIS_TRUE)? true : false;
}

std::string HiRedisAccess::get(const std::string &id) {
  ReplyPtr reply((redisReply*) redisCommand(redis, commands[GET_STRING_VALUE], id.c_str()));

  if(reply->str == 0) {
    throw RedisError("Unknown value \"%s\".", id.c_str());
  }

  return reply->str;
}

jsobjects::JSValuePtr HiRedisAccess::getJSON(const std::string &id) {
  ReplyPtr reply((redisReply*) redisCommand(redis, commands[GET_STRING_VALUE], id.c_str()));

  if(reply->str == 0) {
    return jscontext->undefined();
  }

  return jscontext->fromJson(reply->str);
}

void HiRedisAccess::set(const std::string &id, jsobjects::JSValuePtr val) {
  const std::string& json = jscontext->toJson(val);
  ReplyPtr reply((redisReply*) redisCommand(redis, commands[SET_STRING_VALUE], id.c_str(), json.c_str()));
}


void HiRedisAccess::remove(const std::string &prefix) {
  ReplyPtr reply((redisReply*) redisCommand(redis, commands[KEYS], (prefix+"*").c_str()));

  runCommand("MULTI");
  for(size_t idx = 0; idx < reply->elements; ++idx) {
    ReplyPtr((redisReply*) redisCommand(redis, "DEL %s", reply->element[idx]->str));
  }
  runCommand("EXEC");
}

void HiRedisAccess::beginTransaction() {
  runCommand("MULTI");
}

void HiRedisAccess::cancelTransaction() {
  runCommand("DISCARD");
}

jsobjects::JSArrayPtr HiRedisAccess::executeTransaction() {
  ReplyPtr reply = runCommand("EXEC");
  jsobjects::JSArrayPtr result = createArray(reply.get());
  return result;
}

RedisListPtr HiRedisAccess::asList(const std::string& id) {
  return RedisListPtr(new HiRedisList(*this, id));
}

RedisHashPtr HiRedisAccess::asHash(const std::string &id) {
  return RedisHashPtr(new HiRedisHash(*this, id));
}

ReplyPtr HiRedisAccess::runCommand(const std::string& cmd) {
  redisReply *_reply = (redisReply*) redisCommand(redis, cmd.c_str());
  ReplyPtr reply = wrapReply((void*) _reply);
  return reply;
}

void HiRedisAccess::appendCommand(const std::string& s) {
  redisAppendCommand(redis, s.c_str());
}

ReplyPtr HiRedisAccess::getReply() {
  redisReply *reply;
  redisGetReply(redis, (void**) &reply);
  return wrapReply(reply);
}

jsobjects::JSArrayPtr HiRedisAccess::createArray(redisReply* reply) {
  jsobjects::JSArrayPtr result = jscontext->newArray(reply->elements);
  for(size_t idx = 0; idx < reply->elements; ++idx) {
    switch(reply->element[idx]->type) {
      case REDIS_REPLY_STRING:
        result->setAt(idx, jscontext->newString(reply->element[idx]->str));
        break;
      case REDIS_REPLY_ARRAY:
        result->setAt(idx, createArray(reply->element[idx]));
        break;
      case REDIS_REPLY_INTEGER:
        result->setAt(idx, jscontext->newNumber(reply->element[idx]->integer));
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
        if (scope.empty())
          len = snprintf(buf, BUFFER_LEN, "EXISTS %%s");
        else
          len = snprintf(buf, BUFFER_LEN, "EXISTS %s:%%s", scope.c_str());
        break;
      case DELETE:
        if (scope.empty())
          len = snprintf(buf, BUFFER_LEN, "DEL %%s");
        else
          len = snprintf(buf, BUFFER_LEN, "DEL %s:%%s", scope.c_str());
        break;
      case KEYS:
        if (scope.empty())
          len = snprintf(buf, BUFFER_LEN, "KEYS %%s");
        else
          len = snprintf(buf, BUFFER_LEN, "KEYS %s:%%s", scope.c_str());
        break;
      case GET_STRING_VALUE:
        if (scope.empty())
          len = snprintf(buf, BUFFER_LEN, "GET %%s");
        else
          len = snprintf(buf, BUFFER_LEN, "GET %s:%%s", scope.c_str());
        break;
      case SET_STRING_VALUE:
        if (scope.empty())
          len = snprintf(buf, BUFFER_LEN, "SET %%s %%s");
        else
          len = snprintf(buf, BUFFER_LEN, "SET %s:%%s %%s", scope.c_str());
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

/*static*/ RedisAccessPtr RedisAccess::Create(jsobjects::JSContextPtr jscontext) {
  return RedisAccessPtr(new HiRedisAccess(jscontext));
}

HiRedisList::HiRedisList(HiRedisAccess &redis, const std::string& key): redis(redis), key(key) {
  if (!redis.scope.empty()) {
    this->key = (boost::format("%s:%s") % redis.scope % key).str();
  }
  createCommands();
}

unsigned int HiRedisList::size() {
  ReplyPtr reply = redis.runCommand(commands[LENGTH]);
  return reply->integer;
}

void HiRedisList::add(const std::string &val) {
  ReplyPtr reply((redisReply*) redisCommand(redis.redis, commands[PUSH], val.c_str()));
}

std::string HiRedisList::get(unsigned int index) {
  if(index >= size()) {
    // TODO: throw error
    return "undefined";
  }

  ReplyPtr reply((redisReply*) redisCommand(redis.redis, commands[GET], index));
  return reply->str;
}

jsobjects::JSArrayPtr HiRedisList::asArray() {
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
        len = snprintf(buf, BUFFER_LEN, "LINDEX %s %%d", key.c_str());
        break;
      case GET_ALL:
        len = snprintf(buf, BUFFER_LEN, "LRANGE %s 0 -1", key.c_str());
        break;
    }
    char *str = new char[len+1];
    strncpy(str, buf, len+1);
    commands[idx] = str;
  }
}

HiRedisHash::HiRedisHash(HiRedisAccess &redis, const std::string& key): redis(redis), key(key) {
  if (!redis.scope.empty()) {
    this->key = (boost::format("%s:%s") % redis.scope % key).str();
  }
  createCommands();
}

bool HiRedisHash::contains(const std::string& key)
{
  ReplyPtr reply((redisReply*) redisCommand(redis.redis, commands[CONTAINS], key.c_str()));

  return (reply->integer != 0);
}

jsobjects::JSArrayPtr HiRedisHash::getKeys()
{
  ReplyPtr reply((redisReply*) redisCommand(redis.redis, commands[KEYS], key.c_str()));
  return redis.createArray(reply.get());
}

jsobjects::JSArrayPtr HiRedisHash::getValues()
{
  ReplyPtr reply((redisReply*) redisCommand(redis.redis, commands[VALUES], key.c_str()));
  return redis.createArray(reply.get());
}

std::string HiRedisHash::get(const std::string& key)
{
  ReplyPtr reply((redisReply*) redisCommand(redis.redis, commands[GET], key.c_str()));
  return reply->str;
}

jsobjects::JSValuePtr HiRedisHash::getJSON(const std::string& key)
{
  ReplyPtr reply((redisReply*) redisCommand(redis.redis, commands[GET], key.c_str()));
  if(reply->str == 0) {
    return redis.jscontext->undefined();
  }

  return redis.jscontext->fromJson(reply->str);
}

/*
void HiRedisHash::set(const std::string& key, const std::string& val)
{
  ReplyPtr reply((redisReply*) redisCommand( redis.redis, commands[SET], key.c_str(), val.c_str()));
}
*/

void HiRedisHash::set(const std::string& key, jsobjects::JSValuePtr val) {
  const std::string& json = redis.jscontext->toJson(val);
  ReplyPtr reply((redisReply*) redisCommand( redis.redis, commands[SET], key.c_str(), json.c_str()));
}

void HiRedisHash::remove(const std::string& key)
{
  ReplyPtr reply((redisReply*) redisCommand(redis.redis, commands[REMOVE], key.c_str()));
}

void HiRedisHash::createCommands() {
  char buf[BUFFER_LEN];
  int len;
  for(size_t idx = 0; idx < COMMANDS_MAX; ++idx) {
    switch (idx) {
      case CONTAINS:
        len = snprintf(buf, BUFFER_LEN, "HEXISTS %s %%s", key.c_str());
        break;
      case KEYS:
        len = snprintf(buf, BUFFER_LEN, "HKEYS %s", key.c_str());
        break;
      case VALUES:
        len = snprintf(buf, BUFFER_LEN, "HVALS %s", key.c_str());
        break;
      case GET:
        len = snprintf(buf, BUFFER_LEN, "HGET %s %%s", key.c_str());
        break;
      case SET:
        len = snprintf(buf, BUFFER_LEN, "HSET %s %%s %%s", key.c_str());
        break;
      case REMOVE:
        len = snprintf(buf, BUFFER_LEN, "HDEL %s %%s", key.c_str());
        break;
    }
    char *str = new char[len+1];
    strncpy(str, buf, len+1);
    commands[idx] = str;
  }
}
