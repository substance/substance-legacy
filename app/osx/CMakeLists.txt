# Find necessary OSX frameworks
# =============================

find_library(COREDATA CoreData)
find_library(FOUNDATION Foundation)
find_library(APPKIT AppKit)
find_library(COCOA Cocoa)
find_library(WEBKIT WebKit)

# IBTOOL
# ======

# Make sure we can find the 'ibtool' program. If we can NOT find it we
# skip generation of this project
find_program(IBTOOL ibtool HINTS "/usr/bin" "${OSX_DEVELOPER_ROOT}/usr/bin")
if (${IBTOOL} STREQUAL "IBTOOL-NOTFOUND")
  message(SEND_ERROR "ibtool can not be found and is needed to compile the .xib files. It should have been installed with
                    the Apple developer tools. The default system paths were searched in addition to ${OSX_DEVELOPER_ROOT}/usr/bin")
endif()


# Setup MacOSX bundle information
# ===============================
# Set the OS X Bundle specific CMake variables which will be used to populate the plist for
# the application bundle
set(MACOSX_BUNDLE_INFO_STRING "${PROJECT_NAME}")
set(MACOSX_BUNDLE_GUI_IDENTIFIER "quasipartikel.substance.Substance")
set(MACOSX_BUNDLE_LONG_VERSION_STRING "${PROJECT_NAME} Version ${SUBSTANCE_VERSION}")
set(MACOSX_BUNDLE_BUNDLE_NAME ${PROJECT_NAME})
set(MACOSX_BUNDLE_SHORT_VERSION_STRING ${SUBSTANCE_VERSION})
set(MACOSX_BUNDLE_BUNDLE_VERSION ${SUBSTANCE_VERSION})
set(MACOSX_BUNDLE_COPYRIGHT "Copyright 2012. No Rights Deserved.")

# These variables are specific to our plist and are NOT standard CMake variables
set(MACOSX_BUNDLE_NSMAIN_NIB_FILE "MainMenu")
set(MACOSX_BUNDLE_NSPRINCIPAL_CLASS "NSApplication")

# these are the OS X Interface Builder Files
set (SUBSTANCE_XIBS
  MainMenu
)

# The Substance executable
# ========================

include_directories(
  ${BOOST_DIR}
)

add_executable(substance MACOSX_BUNDLE
  main.m
  appDelegate.h
  appDelegate.m
  MainView.h
  MainView.m
  MainMenu.xib
)

target_link_libraries(substance
  ${COREDATA} ${FOUNDATION}
  ${APPKIT} ${COCOA}
  ${WEBKIT}
)

# Set a custom plist file for the app bundle
set_target_properties(substance PROPERTIES MACOSX_BUNDLE_INFO_PLIST ${CMAKE_CURRENT_SOURCE_DIR}/Info-CMake.plist)

# Make sure the 'Resources' Directory is correctly created before we build
add_custom_command (TARGET substance PRE_BUILD
                      COMMAND mkdir -p ${CMAKE_CURRENT_BINARY_DIR}/\${CONFIGURATION}/substance.app/Contents/Resources)

# Compile the .xib files using the 'ibtool' program with the destination being the app package
foreach(xib ${SUBSTANCE_XIBS})
  add_custom_command (TARGET substance POST_BUILD
                      COMMAND ${IBTOOL} --errors --warnings --notices --output-format human-readable-text
                              --compile ${CMAKE_CURRENT_BINARY_DIR}/\${CONFIGURATION}/substance.app/Contents/Resources/${xib}.nib
                             ${CMAKE_CURRENT_SOURCE_DIR}/${xib}.xib
                      COMMENT "Compiling ${CMAKE_CURRENT_SOURCE_DIR}/${xib}.xib")
endforeach()

add_custom_command (TARGET substance POST_BUILD
  COMMAND ${CMAKE_COMMAND} -E copy_directory ${CMAKE_CURRENT_BINARY_DIR}/substance.app ${PROJECT_SOURCE_DIR}/substance.app
)
