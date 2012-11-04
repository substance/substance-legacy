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
  
  RedisDocStore& instance;
  redisContext* redis;
};

#endif /* #ifndef REDIS_DOC_STORE_TEST_ACCES_HPP */
