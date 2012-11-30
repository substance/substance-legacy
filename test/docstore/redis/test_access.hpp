#ifndef REDIS_DOC_STORE_TEST_ACCES_HPP
#define REDIS_DOC_STORE_TEST_ACCES_HPP

#define TESTING 1
#include <hiredis_access.hpp>
#undef TESTING
#include <hiredis.h>

class HiRedisTestAccess {

public:

  HiRedisTestAccess(HiRedisAccess& instance): instance(instance) {
    redis = instance.redis;
  }

  bool isConnected() {
     return (redis->flags & REDIS_CONNECTED);
  }

  redisContext* GetRedis() { return redis; }

  void deleteAll(const std::string& prefix) {
    instance.remove(prefix);
  }

  ReplyPtr runCommand(const std::string& cmd) {
    return instance.runCommand(cmd);
  }

  HiRedisAccess& instance;

  redisContext* redis;
};

#endif /* #ifndef REDIS_DOC_STORE_TEST_ACCES_HPP */
