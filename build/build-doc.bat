@set REPLACE_FILE=.\CesiumVectorTile.js
@set DOC_PATH=..\Document
jsdoc %REPLACE_FILE% -d %DOC_PATH%
@pause