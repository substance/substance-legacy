#ifndef REDIS_DOC_STORE_TEST_ACCES_HPP
#define REDIS_DOC_STORE_TEST_ACCES_HPP

#define TESTING
#include <docstore/redis/RedisDocStore.h>
#undef TESTING
#include <hiredis.h>

class RedisDocStoreTestAccess {

public:

  RedisDocStoreTestAccess(RedisDocStore& instance): instance(instance) {
    redis = instance.redis;
  }

  bool isConnected() {
     return (redis->flags & REDIS_CONNECTED);
  }

  redisContext* GetRedis() { return redis; }

  void deleteAll(const char *prefix) {
    instance.deleteAll(prefix);
  }

  void write(JSObjectPtr jsobject, const std::string &id) {
    instance.write(jsobject, id);
  }

  RedisDocStore::ReplyPtr runCommand(const std::string& cmd) {
    return instance.runCommand(cmd);
  }

  RedisDocStore& instance;

  redisContext* redis;
};

#endif /* #ifndef REDIS_DOC_STORE_TEST_ACCES_HPP */
