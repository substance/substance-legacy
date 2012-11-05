#include <gtest/gtest.h>

#include "test_access.hpp"

class RedisDocStoreFixture: public testing::Test { 

public: 

  RedisDocStoreFixture(): 
    cleanDB(false), scope("test_substance")
  {
    redis = new RedisDocStore(scope.c_str());
    privAccess = new RedisDocStoreTestAccess(*redis);
  } 

  ~RedisDocStoreFixture( )  { 
    // cleanup any pending stuff, but no exceptions allowed
    if(privAccess) delete privAccess;
    if(redis) delete redis;
  }

  void SetUp() { 
    // code here will execute just before the test ensues
    // initialization code here
  }
  
  void BeginScope(const char* s) {
    cleanDB = true;
    this->scope = scope;
    this->redis->setScopePrefix(s);
  }

  void TearDown( ) { 
    // code here will be called just after the test completes
    // ok to through exceptions from here if need be
    if (cleanDB) {
      privAccess->DeleteData("test_substance");
    }
  }

  // put in any custom data members that you need 
  RedisDocStore *redis;
  RedisDocStoreTestAccess *privAccess;
  bool cleanDB;

  std::string scope;
};

TEST_F(RedisDocStoreFixture, ShouldConnectOnCreation)
{
  
  ASSERT_TRUE(privAccess->isConnected());
}

TEST_F(RedisDocStoreFixture, ShouldDisconnectOnDistruction)
{
  delete redis; redis = 0;
  ASSERT_FALSE(privAccess->isConnected());
}

TEST_F(RedisDocStoreFixture, ShouldThrowOnInvalidServerSetting)
{
  EXPECT_THROW(new RedisDocStore("bla", 1111), RedisDocstoreException);
}

TEST_F(RedisDocStoreFixture, DocumentShouldExistAfterCreation)
{
  BeginScope("test:check_create");
  redis->create("test_id");
  bool val = redis->exists("test_id");
  ASSERT_TRUE(val);
}

TEST_F(RedisDocStoreFixture, ShouldThrowOnDuplicateCreation)
{
  BeginScope("test:throw_on_duplicate_creation");
  if(!redis->exists("test_id")) redis->create("test_id");  
  EXPECT_THROW(redis->create("test_id"), RedisDocstoreException);
}
