#include "test_access.hpp"

#include <gtest/gtest.h>
#include <iostream>
#include <jsobjects_cpp.hpp>

class RedisDocStoreFixture: public testing::Test { 

public: 

  RedisDocStoreFixture(): 
    cleanDB(false), scope("test_substance")
  {
    jscallback = CreateMemberVoidFunction<RedisDocStoreFixture, DocStoreError>(*this, &RedisDocStoreFixture::callback);
  } 

  ~RedisDocStoreFixture( )  { 
    // cleanup any pending stuff, but no exceptions allowed
    if(privAccess) delete privAccess;
    if(redis) delete redis;
  }

  void SetUp() { 
    // code here will execute just before the test ensues
    // initialization code here
    redis = new RedisDocStore();
    privAccess = new RedisDocStoreTestAccess(*redis);
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
  
  void callback(DocStoreError err) {
    this->err = err;
  }

  // put in any custom data members that you need 
  RedisDocStore *redis;
  RedisDocStoreTestAccess *privAccess;

  JSVoidFunction<DocStoreError>::Ptr jscallback;
  std::string scope;

  // states
  bool cleanDB;
  DocStoreError err;

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
  redis->create("test_id", jscallback);
  bool val = redis->exists("test_id");
  ASSERT_TRUE(val);
}

TEST_F(RedisDocStoreFixture, ShouldSetErrorOnDuplicateCreation)
{
  BeginScope("test:throw_on_duplicate_creation");
  if(!redis->exists("test_id")) redis->create("test_id", jscallback);  
  redis->create("test_id", jscallback);
  ASSERT_EQ(DocStoreError::Error, err.code);
}

TEST_F(RedisDocStoreFixture, WriteSimpleJSObject)
{
  BeginScope("test:write_simple_obj");

  JSObjectPtr obj(new JSObjectCpp());
  obj->set("a", "bla");
  obj->set("b", false);
  obj->set("c", 2.1);
  
  privAccess->write(obj, "myobj");
  RedisDocStore::ReplyPtr reply = privAccess->runCommand("HGET test:write_simple_obj:substance:myobj a");
  EXPECT_STREQ("bla", reply->str);
  reply = privAccess->runCommand("HGET test:write_simple_obj:substance:myobj b");
  EXPECT_EQ(0, atoi(reply->str));
  reply = privAccess->runCommand("HGET test:write_simple_obj:substance:myobj c");
  EXPECT_EQ(2.1, atof(reply->str));
}

TEST_F(RedisDocStoreFixture, DISABLED_WriteSimpleJSArray)
{
  // simple array with mixed types
  GTEST_FATAL_FAILURE_("NOT IMPLEMENTED");
  
}

TEST_F(RedisDocStoreFixture, DISABLED_WriteNestedJSObject)
{
  // add a jsobject as member
  // note: the implementation should put some reference info into the object
  //       and create a new object with new key
  GTEST_FATAL_FAILURE_("NOT IMPLEMENTED");
}

TEST_F(RedisDocStoreFixture, DISABLED_WriteJSObjectWithArray)
{
  // same as WriteNestedJSObject but with array type
  GTEST_FATAL_FAILURE_("NOT IMPLEMENTED");
}
