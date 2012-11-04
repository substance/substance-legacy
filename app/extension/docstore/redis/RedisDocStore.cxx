#include "RedisDocStore.h"

#include <hiredis.h>

RedisDocstoreException::RedisDocstoreException(const std::string& msg)
: msg(msg)
{
}

RedisDocStore::RedisDocStore(): hostUrl("127.0.0.1"), port(6379)
{
  connect();
}

RedisDocStore::RedisDocStore(const std::string& url, int port)
: hostUrl(url), port(port)
{
  connect();
}

RedisDocStore::~RedisDocStore()
{
  if(redis != 0) {
    redisFree(redis);
    redis->flags = 0;
    redis = 0;
  }
}

void RedisDocStore::connect()
{
  redis = redisConnect((char*)"127.0.0.1", 6379);
  if (redis->err) {
    char buf[1024];
    snprintf(buf, 1024, "Connection error: %s\n", redis->errstr);
    throw RedisDocstoreException(buf);
  }
}

void RedisDocStore::create(const std::string &id)
{
  // TODO: create the document with given id
}

void RedisDocStore::remove(const std::string &id)
{
  // TODO: remove the document with given id
}

void RedisDocStore::update(const std::string &id, DocumentOperation operations[])
{
}

