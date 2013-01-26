set(DOWNLOAD_DIR ${EXTERNALS_DIR}/boost)
set (BOOST_MINIMAL_INCLUDED ON CACHE INTERNAL "" FORCE)

if (NOT BOOST_MINIMAL_INCLUDED AND DOWNLOAD_EXTERNALS)

  # Configure boost
  # ---------------
  # Note: a script is used to checkout a quasi minimal version

  ExternalProject_Add(boost
    DOWNLOAD_COMMAND svn co --depth files http://svn.boost.org/svn/boost/tags/release/Boost_1_50_0/boost
    DOWNLOAD_DIR ${DOWNLOAD_DIR}
    TMP_DIR ${DOWNLOAD_DIR}/tmp
    STAMP_DIR ${DOWNLOAD_DIR}/stamp
    UPDATE_COMMAND svn update
      ${DOWNLOAD_DIR}/boost/config
      ${DOWNLOAD_DIR}/boost/detail
      ${DOWNLOAD_DIR}/boost/exception
      ${DOWNLOAD_DIR}/boost/smart_ptr
      ${DOWNLOAD_DIR}/boost/algorithm
      ${DOWNLOAD_DIR}/boost/iterator
      ${DOWNLOAD_DIR}/boost/mpl
      ${DOWNLOAD_DIR}/boost/range
      ${DOWNLOAD_DIR}/boost/type_traits
      ${DOWNLOAD_DIR}/boost/preprocessor
      ${DOWNLOAD_DIR}/boost/utility
      ${DOWNLOAD_DIR}/boost/concept
      ${DOWNLOAD_DIR}/boost/function
      ${DOWNLOAD_DIR}/boost/bind
      ${DOWNLOAD_DIR}/boost/format
      ${DOWNLOAD_DIR}/boost/optional
      ${DOWNLOAD_DIR}
    CONFIGURE_COMMAND "" # skip configure
    BUILD_COMMAND "" # skip build
    INSTALL_COMMAND "" # skip install
  )

endif()

set(Boost_INCLUDE_DIRS ${EXTERNALS_DIR}/boost)
