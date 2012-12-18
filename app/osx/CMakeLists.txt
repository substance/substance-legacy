# Find necessary OSX frameworks
# =============================

find_library(COREDATA CoreData)
find_library(FOUNDATION Foundation)
find_library(APPKIT AppKit)
find_library(COCOA Cocoa)
find_library(WEBKIT WebKit)

include(MacOSXib)

# Setup MacOSX bundle information
# ===============================
# Set the OS X Bundle specific CMake variables which will be used to populate the plist for
# the application bundle
set(MACOSX_BUNDLE_INFO_STRING "${PROJECT_NAME}")
set(MACOSX_BUNDLE_GUI_IDENTIFIER "quasipartikel.Substance")
set(MACOSX_BUNDLE_LONG_VERSION_STRING "${PROJECT_NAME} Version ${SUBSTANCE_VERSION}")
set(MACOSX_BUNDLE_BUNDLE_NAME ${PROJECT_NAME})
set(MACOSX_BUNDLE_SHORT_VERSION_STRING ${SUBSTANCE_VERSION})
set(MACOSX_BUNDLE_BUNDLE_VERSION ${SUBSTANCE_VERSION})
set(MACOSX_BUNDLE_COPYRIGHT "Copyright 2012. No Rights Deserved.")

# These variables are specific to our plist and are NOT standard CMake variables
set(MACOSX_BUNDLE_NSMAIN_NIB_FILE "MainMenu")
set(MACOSX_BUNDLE_NSPRINCIPAL_CLASS "NSApplication")
set(MACOSX_BUNDLE_ICON_FILE "${PROJECT_NAME}.icns")

# The Substance executable
# ========================

SET (TARGET_NAME "Substance")
SET(BUNDLE_LOCATION ${CMAKE_CURRENT_BINARY_DIR}/${CONFIGURATION}/${TARGET_NAME}.app)

link_directories(
  ${HIREDIS_LIB_DIRS}
  ${jsobjects_LIBRARY_DIRS}
)

if(ENABLE_DEVELOPER_EXTRAS)
  add_definitions(-DDEVELOPER_EXTRAS)
endif()

add_executable(${TARGET_NAME} MACOSX_BUNDLE
  main.m
  appDelegate.h
  appDelegate.m
  MainView.h
  MainView.m
  MainMenu.xib
)

target_link_libraries(${TARGET_NAME}
  ${COREDATA} ${FOUNDATION}
  ${APPKIT} ${COCOA}
  ${WEBKIT}
  redisdocstore
)

# Set a custom Info.plist file template.
# This file is a CMake template file which is processed by CMake and stored into
# the Application's Content folder.
set_target_properties(${TARGET_NAME} PROPERTIES
  MACOSX_BUNDLE_INFO_PLIST ${CMAKE_CURRENT_SOURCE_DIR}/Info-CMake.plist
)

# Make sure the 'Resources' Directory is correctly created before we build
add_custom_command (TARGET ${TARGET_NAME}
  PRE_BUILD
  COMMAND mkdir -p ${BUNDLE_LOCATION}/Contents/Resources
  #COMMAND mkdir -p ${BUNDLE_LOCATION}/Contents/Assets
)

# compile MainMenu.xib after build is finished
compile_xib (${TARGET_NAME} ${BUNDLE_LOCATION} ${CMAKE_CURRENT_SOURCE_DIR}/MainMenu.xib)

if(NOT EXISTS ${BUNDLE_LOCATION}/Contents/Resources)
  file(MAKE_DIRECTORY ${BUNDLE_LOCATION}/Contents/Resources)
endif()

execute_process(
  COMMAND rsync -r ${CMAKE_CURRENT_SOURCE_DIR}/Resources/${MACOSX_BUNDLE_ICON_FILE} ${BUNDLE_LOCATION}/Contents/Resources
)

if (NOT EXISTS ${BUNDLE_LOCATION}/Contents/Assets)
  execute_process(
    COMMAND ln -s ${PROJECT_SOURCE_DIR} ${BUNDLE_LOCATION}/Contents/Assets
    COMMAND ln -s ${PROJECT_SOURCE_DIR}/ext/redisdb/bin ${BUNDLE_LOCATION}/Contents/Redis
  )
endif ()


add_custom_command(TARGET ${TARGET_NAME}
  POST_BUILD
  COMMAND rsync -r ${CMAKE_CURRENT_SOURCE_DIR}/Resources/${MACOSX_BUNDLE_ICON_FILE} ${BUNDLE_LOCATION}/Contents/Resources
)


# Install
# =======
set (DIST_DIR ${PROJECT_SOURCE_DIR}/dist)
set (BUNDLE_DIST ${DIST_DIR}/${TARGET_NAME}.app)
set (ASSETS_DIST_DIR ${BUNDLE_DIST}/Contents/Assets)
set (REDISDB_DIST_DIR ${BUNDLE_DIST}/Contents/Redis)

install(CODE "
  execute_process(
    COMMAND rsync -r --exclude=Assets ${BUNDLE_LOCATION} ${DIST_DIR}
  )
  execute_process(
    COMMAND rsync -r ${PROJECT_SOURCE_DIR}/data ${ASSETS_DIST_DIR}
  )
  execute_process(
    COMMAND rsync -r ${PROJECT_SOURCE_DIR}/images ${ASSETS_DIST_DIR}
  )
  execute_process(
    COMMAND rsync -r ${PROJECT_SOURCE_DIR}/lib ${ASSETS_DIST_DIR}
  )
  execute_process(
    COMMAND rsync -r ${PROJECT_SOURCE_DIR}/src ${ASSETS_DIST_DIR}
  )
  execute_process(
    COMMAND rsync ${PROJECT_SOURCE_DIR}/index.html ${ASSETS_DIST_DIR}
  )
  execute_process(
    COMMAND rsync ${PROJECT_SOURCE_DIR}/composer.css ${ASSETS_DIST_DIR}
  )
  execute_process(
    COMMAND rsync ${PROJECT_SOURCE_DIR}/substance.css ${ASSETS_DIST_DIR}
  )
  execute_process(
    COMMAND rsync ${PROJECT_SOURCE_DIR}/package.json ${ASSETS_DIST_DIR}
  )
  execute_process(
    COMMAND rsync ${PROJECT_SOURCE_DIR}/README.md ${ASSETS_DIST_DIR}
  )
  execute_process(
    COMMAND rsync ${PROJECT_SOURCE_DIR}/LICENSE ${ASSETS_DIST_DIR}
  )
  execute_process(
    COMMAND rsync ${PROJECT_SOURCE_DIR}/ext/redisdb/bin/redis-server ${REDISDB_DIST_DIR}/
  )
  execute_process(
    COMMAND rsync ${PROJECT_SOURCE_DIR}/redis.conf ${REDISDB_DIST_DIR}/a
  )
" COMPONENT Runtime)

install(CODE "
  include(BundleUtilities)
  fixup_bundle(\"${BUNDLE_DIST}\" \"\" \"${OSX_LIBRARY_OUTPUT_DIR}\")
  " COMPONENT Runtime)
