# Configure boost
# ---------------
# Note: a script is used to checkout a quasi minimal version

ExternalProject_Add(boost
  DOWNLOAD_COMMAND /bin/sh ${PROJECT_SOURCE_DIR}/config/boost_minimal.sh
  PREFIX ${PROJECT_BINARY_DIR}/lib/boost
  UPDATE_COMMAND "" # don't update, i.e., always use the same version
  CONFIGURE_COMMAND "" # skip configure
  BUILD_COMMAND "" # skip build
  INSTALL_COMMAND "" # skip install
)
set(BOOST_INCLUDE_DIRS ${PROJECT_BINARY_DIR}/lib/boost/src)

# Configure GoogleTest library
# ----------------------------
# checkout and build GTest 1.6.0 automatically
set(GTEST_EPBASE ${PROJECT_BINARY_DIR}/lib/gtest)
ExternalProject_Add(gtest
  SVN_REPOSITORY "http://googletest.googlecode.com/svn/tags/release-1.6.0"
  SVN_TRUST_CERT 1
  PREFIX ${GTEST_EPBASE}
  BINARY_DIR ${GTEST_EPBASE}/bin
  UPDATE_COMMAND "" # don't update, i.e., always use the same version
  BUILD_COMMAND make
  INSTALL_COMMAND "" # skip install
)

set(GTEST_INCLUDE_DIRS ${GTEST_EPBASE}/src/gtest/include)
set(GTEST_LIB_DIRS ${GTEST_EPBASE}/bin)
set(GTEST_LIBS gtest gtest_main)
