
test:
	./node_modules/.bin/mocha \
		--reporter list \
		--timeout 1500 \
		test/*.js

.PHONY: test