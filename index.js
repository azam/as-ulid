// Copyright Azamshul Azizy 2020. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

const fs = require('fs')
const path = require('path')
const { getRandomValues } = require('crypto').webcrypto;
const loader = require('@assemblyscript/loader')
const imports = {
    ulid: {
        systemTime: () => BigInt(Date.now()),
        randomBytes: size => getRandomValues(new Uint8Array(size))
    }
}
const wasmPath = path.join(__dirname, 'build', 'release', 'ulid.wasm')
const wasmModule = loader.instantiateSync(fs.readFileSync(wasmPath), imports)
const decoder = new TextDecoder('utf-8');
function createBytes (...bytes) {
    return wasmModule.exports.__newArray(wasmModule.exports.U8ARR_ID, new Uint8Array(bytes))
}
function consumeBytes (ptr) {
    const value = wasmModule.exports.__getUint8Array(ptr);
    wasmModule.exports.__release(ptr);
    return value;
}
function generateString(time, ...bytes) {
    return decoder.decode(consumeBytes(wasmModule.exports.generate(BigInt(time), createBytes(...bytes))))
}
wasmModule.exports.createBytes = createBytes;
wasmModule.exports.consumeBytes = consumeBytes;
wasmModule.exports.generateString = generateString;
module.exports = wasmModule.exports
