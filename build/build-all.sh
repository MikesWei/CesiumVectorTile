node r.js -o main.js
TEMP_FILE=temp.temp
TEMPLATE_FILE=./Template.js
REPLACE_FILE=./CesiumVectorTile.js
REPLACE_MIN_FILE=./CesiumVectorTile.min.js
cp -r $TEMPLATE_FILE $TEMP_FILE
sed -i '' '/\/\/----CesiumVectorTile----/r ./CesiumVectorTile.js' $TEMP_FILE
##@pause
cp $TEMP_FILE $REPLACE_FILE
rm $TEMP_FILE
uglifyjs $REPLACE_FILE -m -o $REPLACE_MIN_FILE
##@pause