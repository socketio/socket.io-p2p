# socket.io-p2p streaming example

## Install dependencies
If you haven't done so already, go to the root of the repository and `npm install` the dependencies.

## Run
To start, `cd` to this directory (`examples/streaming`) and run the following:

```
browserify src/index.js -o bundle.js
node server.js
```

(You will need `browserify` for this. If it isn't installed get it with `npm install --global browserfiy`)

## Further examples
See [feross/simple-peer](https://github.com/feross/simple-peer#videovoice) for additional examples on how to stream media.
