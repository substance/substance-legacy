set(DOWNLOAD_DIR ${EXTERNALS_DIR}/jsobjects)

if (DOWNLOAD_EXTERNALS)

  ExternalProject_Add(jsobjects
    GIT_REPOSITORY git://github.com/oliver----/jsobjects.git
    PREFIX ${DOWNLOAD_DIR}
    DOWNLOAD_DIR ${DOWNLOAD_DIR}
    STAMP_DIR ${DOWNLOAD_DIR}/stamp
    SOURCE_DIR ${DOWNLOAD_DIR}/jsobjects
    BINARY_DIR ${DOWNLOAD_DIR}/bin
    UPDATE_COMMAND "" # skip update
    CONFIGURE_COMMAND ${CMAKE_COMMAND} -DIMPORT=ON -DENABLE_SWIG=ON -DENABLE_JSC=ON -DEXTERNALS_DIR=${EXTERNALS_DIR} ${DOWNLOAD_DIR}/jsobjects
    #BUILD_COMMAND make
    INSTALL_COMMAND "" # skip install
  )

endif ()

set(jsobjects_INCLUDE_DIRS ${DOWNLOAD_DIR}/jsobjects/include)
