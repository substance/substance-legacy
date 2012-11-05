#ifndef _REDIS_DOC_STORE_H_
#define _REDIS_DOC_STORE_H_

#include "operation.h"
#include <../../swig-v8/Examples/php/sync/example.h>
#include <string>

struct redisContext;

class RedisDocStore {
  
protected:

  enum REDIS_COMMANDS {
    SUBSTANCE_SCOPE = 0,
    DOC_EXISTS,
    SET_VALUE,
    REDIS_COMMANDS_MAX
  };

public:

  /**
   * Create a Redis based DocumentStore.
   * To avoid data name collision you can add a custom prefix.
   * 
   * @param scopePrefix a prefix for all used redis keys
   **/
  RedisDocStore(const char *scopePrefix = 0);

  /**
   * Create a Redis based DocumentStore.
   * Additionally, specify the servers url and port.
   * 
   * @param scopePrefix url
   * @param scopePrefix port
   * @param scopePrefix a prefix for all used redis keys
   **/
   RedisDocStore(const std::string& url, int port, const char *scopePrefix = 0);

  ~RedisDocStore();

  /**
   * Checks if a document exists with a given id.
   * @param id a unique document id
   * @return true if exists, else false
   **/
  bool exists(const std::string &id);

  /**
   * Creates a document with a given id.
   * @param id a unique document id
   * @throw RedisDocstoreException if the id is already in use
   **/
  void create(const std::string &id);

  /**
   * Removes a document with a given id from the doc store.
   * @param id a unique document id
   **/
  void remove(const std::string &id);

  /**
   * Updates a document with a given id applying the provided operations.
   * @param id a unique document id
   **/
  void update(const std::string &id, DocumentOperation operations[]);

  // Document* get(const std::string &id);

  void setScopePrefix(const char* scope);
  
protected:

  /**
   * Connects to a Redis server.
   * @param url
   * @param port
   * @throw RedisDocstoreException if connection could not be created
   **/
  void connect(const std::string& url, int port);
  
  void disconnect();

  /**
   * Creates a table of Redis command templates (for internal use).
   */
  void create_commands();

protected:

  const std::string hostUrl;
  const int port;
  const char* scopePrefix;
  const char* commandTemplates[REDIS_COMMANDS_MAX];

  redisContext *redis;

#ifdef ENABLE_TEST_EXTENSIONS
/* -------- TESTING: Methods for checking during testing */
private:
  friend class RedisDocStoreTestAccess;
/* -------- TESTING */
#endif
};

class RedisDocstoreException {

public:
  
  RedisDocstoreException();

  RedisDocstoreException(const std::string& msg);
  
  RedisDocstoreException(const char* format, ...);
  
  const std::string msg;
};

#endif /* _REDIS_DOC_STORE_H_ */
