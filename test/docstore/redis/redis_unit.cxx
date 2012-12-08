#include <gtest/gtest.h>
#include <iostream>

#include <jsobjects_cpp.hpp>
#include <redis_error.hpp>
#include "test_access.hpp"

using namespace jsobjects;

class HiRedisAccessFixture: public testing::Test {

public:

  HiRedisAccessFixture()
    : scope("test_substance"), cleanDB(false) { }

  ~HiRedisAccessFixture( )  {
  }

  void SetUp() {
    jscontext = JSContextPtr(new JSContextCpp());
    // code here will execute just before the test ensues
    // initialization code here
    redis = boost::shared_ptr<HiRedisAccess>(new HiRedisAccess(jscontext));
    privAccess = boost::shared_ptr<HiRedisTestAccess>(new HiRedisTestAccess(*redis));

    // set a default scope to avoid data collision with real app content
    redis->setScope(scope.c_str());
  }

  /**
   * Lets a test case use an own data scope
   * in Redis to avoid interference with data changes of other tests.
   */
  void BeginScope(const char* s) {
    cleanDB = true;
    this->scope = s;
    this->redis->setScope(s);
  }

  void TearDown( ) {
    // code here will be called just after the test completes
    // ok to through exceptions from here if need be
    if (cleanDB) {
      privAccess->deleteAll(this->scope.c_str());
    }
  }

  JSContextPtr jscontext;
  boost::shared_ptr<HiRedisAccess> redis;
  boost::shared_ptr<HiRedisTestAccess> privAccess;

  std::string scope;

  // states
  bool cleanDB;

};

TEST_F(HiRedisAccessFixture, ShouldConnectOnCreation)
{
  ASSERT_TRUE(privAccess->isConnected());
}

TEST_F(HiRedisAccessFixture, ShouldDisconnectOnDistruction)
{
  redis.reset();
  ASSERT_FALSE(privAccess->isConnected());
}

TEST_F(HiRedisAccessFixture, ShouldThrowOnInvalidServerSetting)
{
  redis->setHost("bla");
  redis->setPort(1111);
  EXPECT_THROW(redis->connect(), RedisError);
}

TEST_F(HiRedisAccessFixture, ValueShouldExistAfterSet)
{
  redis->connect();
  BeginScope("test:check_set");
  redis->set("test_id", jscontext->newString("bla"));
  bool val = redis->exists("test_id");
  ASSERT_TRUE(val);
}
