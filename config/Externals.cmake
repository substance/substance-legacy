include(ExternalProject)

FIND_PACKAGE(Boost)
if(Boost-NOTFOUND)
  include(BoostMinimal)
endif()

if(ENABLE_TESTS)
	include(GTest-1.6)
endif()

include(Redis)

include(JavaScriptCore)
include(JSObjects)
include(SwigJS)

include(RedisDocStore)
