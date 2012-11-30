
if (DOWNLOAD_EXTERNALS)

  # Configure hiredis
  # -----------------
  ExternalProject_Add(redisdb
    GIT_REPOSITORY "https://github.com/antirez/redis.git"
    GIT_TAG "2.6.6"
    DOWNLOAD_DIR ${EXTERNALS_DIR}/redisdb
    SOURCE_DIR ${EXTERNALS_DIR}/redisdb/redis
    BINARY_DIR ${EXTERNALS_DIR}/redisdb/redis
    STAMP_DIR ${EXTERNALS_DIR}/redisdb/stamp
    TMP_DIR ${EXTERNALS_DIR}/redisdb/tmp
    UPDATE_COMMAND "" # don't update, i.e., always use the same version
    CONFIGURE_COMMAND "" # skip configure
    BUILD_COMMAND make
    INSTALL_COMMAND make PREFIX=${EXTERNALS_DIR}/redisdb install
  )

else ()

endif ()
