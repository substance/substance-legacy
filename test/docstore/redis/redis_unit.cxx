#include <gtest/gtest.h>

#include "RedisDocStoreTestAccess.hpp"

TEST(RedisDocStoreTest, ShouldConnectOnCreation)
{
  RedisDocStore redis;
  RedisDocStoreTestAccess access(redis);
  ASSERT_TRUE(access.isConnected());
}

TEST(RedisDocStoreTest, ShouldDisConnectOnDistruction)
{
  RedisDocStore redis;
  RedisDocStoreTestAccess access(redis);
  redis.~RedisDocStore();
  ASSERT_FALSE(access.isConnected());
}
