#include "RedisDocStore.h"

#include <hiredis.h>
#include <cstdarg>
#include <string.h>
#include <boost/shared_ptr.hpp>

#define REDIS_TRUE 1
#define REDIS_FALSE 0

#define SUBSTANCE_DOC_UID "substance:docs:%s"

#define BUFFER_LEN 1024

typedef boost::shared_ptr<redisReply> ReplyPtr;

static ReplyPtr WrapReply(void* reply) {
  ReplyPtr ptr((redisReply*) reply, freeReplyObject);  
  return ptr;
}

RedisDocStore::RedisDocStore(const char *scopePrefix)
: hostUrl("127.0.0.1"), port(6379), scopePrefix(scopePrefix)
{
  create_commands();
  connect(hostUrl, port);
}

RedisDocStore::RedisDocStore(const std::string& url, int port, const char *scopePrefix)
: hostUrl(url), port(port), scopePrefix(scopePrefix)
{
  create_commands();
  connect(hostUrl, port);
}

RedisDocStore::~RedisDocStore()
{
  if(redis != 0) {
    redisFree(redis);
    redis->flags = 0;
    redis = 0;
  }  
  for(size_t idx = 0; idx < REDIS_COMMANDS_MAX; ++idx) {
    if(commandTemplates[idx]) {
      delete[] commandTemplates[idx];
    }
  }
}

void RedisDocStore::create_commands()
{
  char buf[BUFFER_LEN];
  int len;
  for(size_t idx = 0; idx < REDIS_COMMANDS_MAX; ++idx) {
    switch (idx) {
      case SUBSTANCE_SCOPE:
        if(scopePrefix != 0)
          len = snprintf(buf, BUFFER_LEN, "%s:substance", scopePrefix);
        else
          len = snprintf(buf, BUFFER_LEN, "substance");
        break;
      case DOC_EXISTS:
        len = snprintf(buf, BUFFER_LEN, "EXISTS %s:%%s", commandTemplates[SUBSTANCE_SCOPE]);
        break;
      case SET_VALUE:
        len = snprintf(buf, BUFFER_LEN, "HSET %s:%%s %%s %%s", commandTemplates[SUBSTANCE_SCOPE]);
        break;
    }
    char *str = new char[len+1];
    strncpy(str, buf, len+1);
    commandTemplates[idx] = str;
  }
}

void RedisDocStore::connect(const std::string& url, int port)
{
  redis = redisConnect(url.c_str(), port);
  if (redis->err) {
    throw RedisDocstoreException("Connection error: %s\n", redis->errstr);
  }
}

bool RedisDocStore::exists(const std::string &id)
{
  ReplyPtr reply = WrapReply(redisCommand(redis, commandTemplates[DOC_EXISTS], id.c_str()));
  if(reply->integer == REDIS_TRUE) {
    return true;
  } else {
    return false;
  }
}

void RedisDocStore::create(const std::string &id)
{
  // check if the document is already exisiting
  if(exists(id)) {
    throw RedisDocstoreException("Key with id %s already exists", id.c_str());
  }
  
  // TODO: set default values?
  ReplyPtr reply = WrapReply(redisCommand(redis, commandTemplates[SET_VALUE], 
                              id.c_str(), "id", id.c_str()));
  if(reply->integer == REDIS_FALSE) {
    throw RedisDocstoreException("Key with id %s already exists", id.c_str());
  }
}

void RedisDocStore::remove(const std::string &id)
{  
  // TODO: remove document and *all* its content
  WrapReply(redisCommand(redis, "DEL %s", id.c_str()));
}

void RedisDocStore::update(const std::string &id, DocumentOperation operations[])
{
}

void RedisDocStore::disconnect()
{
  //WrapReply(redisCommand(redis ))
}

void RedisDocStore::setScopePrefix(const char* scope)
{
  scopePrefix = scope;
  create_commands();
}


std::string RedisDocstoreException_createMessage(const char *format, va_list ap) {
  char buf[BUFFER_LEN];
  snprintf(buf, BUFFER_LEN, format, ap);
  return std::string(buf);
}

RedisDocstoreException::RedisDocstoreException()
: msg("")
{
}

RedisDocstoreException::RedisDocstoreException(const std::string& msg)
: msg(msg)
{
}

RedisDocstoreException::RedisDocstoreException(const char *format, ...)
{
  va_list ap;
  va_start(ap, format);
  std::string _msg(RedisDocstoreException_createMessage(format, ap));
  va_end(ap);
  std::string* pmsg = const_cast<std::string*>(&msg);
  pmsg->append(msg);
}
