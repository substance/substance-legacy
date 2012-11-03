# Configure boost
# ---------------
# Note: a script is used to checkout a quasi minimal version

ExternalProject_Add(boost
  DOWNLOAD_COMMAND /bin/sh ${PROJECT_SOURCE_DIR}/config/boost_minimal.sh
  DOWNLOAD_DIR ${PROJECT_SOURCE_DIR}/ext/boost
  TMP_DIR ${PROJECT_BINARY_DIR}/ext/boost/tmp
  STAMP_DIR ${PROJECT_BINARY_DIR}/ext/boost/stamp
  UPDATE_COMMAND "" # don't update, i.e., always use the same version
  CONFIGURE_COMMAND "" # skip configure
  BUILD_COMMAND "" # skip build
  INSTALL_COMMAND "" # skip install
)

# Configure GoogleTest library
# ----------------------------
# checkout and build GTest 1.6.0 automatically
set(GTEST_EPBASE ${PROJECT_BINARY_DIR}/ext/gtest)
ExternalProject_Add(gtest
  SVN_REPOSITORY "http://googletest.googlecode.com/svn/tags/release-1.6.0"
  SVN_TRUST_CERT 1
  PREFIX ${PROJECT_SOURCE_DIR}/ext/gtest
  DOWNLOAD_DIR ${PROJECT_SOURCE_DIR}/ext/gtest
  STAMP_DIR ${PROJECT_SOURCE_DIR}/ext/gtest/stamp
  SOURCE_DIR ${PROJECT_SOURCE_DIR}/ext/gtest/gtest
  BINARY_DIR ${PROJECT_SOURCE_DIR}/ext/gtest/bin
  UPDATE_COMMAND "" # don't update, i.e., always use the same version
  BUILD_COMMAND make
  INSTALL_COMMAND "" # skip install
)

# Configure hiredis
# -----------------
ExternalProject_Add(hiredis
  GIT_REPOSITORY "https://github.com/redis/hiredis.git"
  DOWNLOAD_DIR ${PROJECT_SOURCE_DIR}/ext/hiredis
  SOURCE_DIR ${PROJECT_SOURCE_DIR}/ext/hiredis/hiredis
  BINARY_DIR ${PROJECT_SOURCE_DIR}/ext/hiredis/hiredis
  STAMP_DIR ${PROJECT_SOURCE_DIR}/ext/hiredis/stamp
  TMP_DIR ${PROJECT_SOURCE_DIR}/ext/hiredis/tmp
  UPDATE_COMMAND "" # don't update, i.e., always use the same version
  CONFIGURE_COMMAND "" # skip configure
  BUILD_COMMAND make
  INSTALL_COMMAND "" # skip install
)
