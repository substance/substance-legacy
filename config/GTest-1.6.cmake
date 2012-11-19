
if (DOWNLOAD_EXTERNALS)

  # Configure GoogleTest library
  # ----------------------------
  # checkout and build GTest 1.6.0 automatically
  #set(GTEST_EPBASE ${PROJECT_BINARY_DIR}/ext/gtest)
  ExternalProject_Add(gtest
    SVN_REPOSITORY "http://googletest.googlecode.com/svn/tags/release-1.6.0"
    SVN_TRUST_CERT 1
    PREFIX ${EXTERNALS_DIR}/gtest
    DOWNLOAD_DIR ${EXTERNALS_DIR}/gtest
    STAMP_DIR ${EXTERNALS_DIR}/gtest/stamp
    SOURCE_DIR ${EXTERNALS_DIR}/gtest/gtest
    BINARY_DIR ${EXTERNALS_DIR}/gtest/bin
    UPDATE_COMMAND "" # don't update, i.e., always use the same version
    BUILD_COMMAND make
    INSTALL_COMMAND "" # skip install
  )

else ()

  set(GTEST_INCLUDE_DIRS ${EXTERNALS_DIR}/gtest/gtest/include)
  set(GTEST_LIB_DIRS ${EXTERNALS_DIR}/gtest/bin)
  set(GTEST_LIBS gtest gtest_main)

endif ()
