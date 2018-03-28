GENERATED_FILES = \
	lib.js

all: node_modules $(GENERATED_FILES)

node_modules:
	npm install

lib.js: index.js
	node_modules/.bin/browserify -t brfs node_modules/topojson/index.js index.js -o $@

clean:
	rm -f -- $(GENERATED_FILES)
	rm -rf node_modules/
