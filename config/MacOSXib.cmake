
# IBTOOL
# ======

# Make sure we can find the 'ibtool' program. If we can NOT find it we
# skip generation of this project
find_program(IBTOOL ibtool HINTS "/usr/bin" "${OSX_DEVELOPER_ROOT}/usr/bin")
if (${IBTOOL} STREQUAL "IBTOOL-NOTFOUND")
  message(SEND_ERROR "ibtool can not be found and is needed to compile the .xib files. It should have been installed with 
                    the Apple developer tools. The default system paths were searched in addition to ${OSX_DEVELOPER_ROOT}/usr/bin")
endif()


# FUNCTION compile_xib (TARGET_NAME BUNDLE_LOCATION XIB_FILE)

function (compile_xib TARGET_NAME BUNDLE_LOCATION XIB_FILE)

	get_filename_component(XIB_BASENAME ${XIB_FILE} NAME_WE)

	add_custom_command (TARGET ${TARGET_NAME}
		POST_BUILD
		COMMAND ${IBTOOL}
			--errors --warnings --notices
			--output-format human-readable-text 
	        --compile ${BUNDLE_LOCATION}/Contents/Resources/${XIB_BASENAME}.nib 
	        ${XIB_FILE}
	        COMMENT "Compiling ${XIB_FILE}"
	)

endfunction()
