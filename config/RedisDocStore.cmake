set(DOWNLOAD_DIR ${EXTERNALS_DIR}/store)

if (NOT EXISTS ${DOWNLOAD_DIR} AND DOWNLOAD_EXTERNALS)

	ExternalProject_Add(store_external
		GIT_REPOSITORY https://github.com/substance/store.git
		PREFIX ${DOWNLOAD_DIR}
		DOWNLOAD_DIR ${DOWNLOAD_DIR}
		STAMP_DIR ${DOWNLOAD_DIR}/stamp
		SOURCE_DIR ${DOWNLOAD_DIR}/store
		BINARY_DIR ${DOWNLOAD_DIR}/store
		UPDATE_COMMAND git pull origin master # skip update
		CONFIGURE_COMMAND ${CMAKE_COMMAND} -DIMPORT=ON
		    -DENABLE_JSC=ON -DENABLE_TESTS=OFF
		    -DEXTERNALS_DIR=${EXTERNALS_DIR}
		    ${DOWNLOAD_DIR}/store
		BUILD_COMMAND make
		INSTALL_COMMAND "" # skip install
	)

else ()

	include(${DOWNLOAD_DIR}/store/RedisDocStore.cmake)

endif ()

