
if (DOWNLOAD_EXTERNALS)

  # Configure boost
  # ---------------
  # Note: a script is used to checkout a quasi minimal version
  set(DOWNLOAD_DIR ${EXTERNALS_DIR}/boost)

  ExternalProject_Add(boost
    DOWNLOAD_COMMAND svn co --depth files http://svn.boost.org/svn/boost/tags/release/Boost_1_50_0/boost
    DOWNLOAD_DIR ${DOWNLOAD_DIR}
    TMP_DIR ${DOWNLOAD_DIR}/tmp
    STAMP_DIR ${DOWNLOAD_DIR}/stamp
    UPDATE_COMMAND svn update ${DOWNLOAD_DIR}/boost/config ${DOWNLOAD_DIR}/boost/detail ${DOWNLOAD_DIR}/boost/exception ${DOWNLOAD_DIR}/boost/smart_ptr ${DOWNLOAD_DIR}
    CONFIGURE_COMMAND "" # skip configure
    BUILD_COMMAND "" # skip build
    INSTALL_COMMAND "" # skip install
  )

endif()

set(BOOST_INCLUDE_DIRS ${EXTERNALS_DIR}/boost)
