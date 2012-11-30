
if (DOWNLOAD_EXTERNALS)

  # Configure hiredis
  # -----------------
  ExternalProject_Add(hiredis
    GIT_REPOSITORY "https://github.com/redis/hiredis.git"
    DOWNLOAD_DIR ${EXTERNALS_DIR}/hiredis
    SOURCE_DIR ${EXTERNALS_DIR}/hiredis/hiredis
    BINARY_DIR ${EXTERNALS_DIR}/hiredis/hiredis
    STAMP_DIR ${EXTERNALS_DIR}/hiredis/stamp
    TMP_DIR ${EXTERNALS_DIR}/hiredis/tmp
    UPDATE_COMMAND "" # don't update, i.e., always use the same version
    CONFIGURE_COMMAND "" # skip configure
    BUILD_COMMAND make static
    INSTALL_COMMAND "" # skip install
  )

else ()

  set(HIREDIS_INCLUDE_DIRS ${EXTERNALS_DIR}/hiredis/hiredis)
  set(HIREDIS_LIB_DIRS "${EXTERNALS_DIR}/hiredis/hiredis")
  set(HIREDIS_LIBS libhiredis.a)

endif ()
