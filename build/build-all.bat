node r.js -o main.js
@set TEMP_FILE=temp.temp
@set TEMPLATE_FILE=Template.js
@set REPLACE_FILE=.\CesiumVectorTile.js
@set REPLACE_MIN_FILE=.\CesiumVectorTile.min.js
@copy %TEMPLATE_FILE% %TEMP_FILE%
@sed -i '/\/\/----CesiumVectorTile----/ r %REPLACE_FILE%' %TEMP_FILE%
@copy %TEMP_FILE% %REPLACE_FILE%
@del %TEMP_FILE%
uglifyjs %REPLACE_FILE% -m -o %REPLACE_MIN_FILE%
@pause