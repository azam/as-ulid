// Copyright Azamshul Azizy 2020. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

// @ts-ignore
@external('ulid', 'systemTime')
export declare function systemTime(): i64;

// @ts-ignore
@external('ulid', 'randomBytes')
export declare function randomBytes(size: i32): u8[];

export const U8ARR_ID = idof<u8[]>();
export const ULID_LENGTH: i32 = 26;
export const ENTROPY_LENGTH: i32 = 10;
export const MIN_TIME: i64 = 0;
export const MAX_TIME: i64 = 0x0000ffffffffffff;

const C: u8[] = [ //
  0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, //
  0x38, 0x39, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46, //
  0x47, 0x48, 0x4a, 0x4b, 0x4d, 0x4e, 0x50, 0x51, //
  0x52, 0x53, 0x54, 0x56, 0x57, 0x58, 0x59, 0x5a ];

function randomEntropy(): u8[] {
  const entropy = randomBytes(ENTROPY_LENGTH);
  if (entropy.length < ENTROPY_LENGTH) {
    return [];
  }
  return entropy;
}

export function generate(time: i64, entropy: u8[]): u8[] {
  if (time < MIN_TIME || time > MAX_TIME || entropy.length < ENTROPY_LENGTH) {
    const chars: u8[] = [];
    return chars;
  }

  const chars: u8[] = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];

  // time
  chars[0] = C[u8(time >>> 45) & 0x1f];
  chars[1] = C[u8(time >>> 40) & 0x1f];
  chars[2] = C[u8(time >>> 35) & 0x1f];
  chars[3] = C[u8(time >>> 30) & 0x1f];
  chars[4] = C[u8(time >>> 25) & 0x1f];
  chars[5] = C[u8(time >>> 20) & 0x1f];
  chars[6] = C[u8(time >>> 15) & 0x1f];
  chars[7] = C[u8(time >>> 10) & 0x1f];
  chars[8] = C[u8(time >>> 5) & 0x1f];
  chars[9] = C[u8(time) & 0x1f];

  // entropy
  chars[10] = C[(entropy[0] & 0xff) >>> 3];
  chars[11] = C[((entropy[0] << 2) | ((entropy[1] & 0xff) >>> 6)) & 0x1f];
  chars[12] = C[((entropy[1] & 0xff) >>> 1) & 0x1f];
  chars[13] = C[((entropy[1] << 4) | ((entropy[2] & 0xff) >>> 4)) & 0x1f];
  chars[14] = C[((entropy[2] << 1) | ((entropy[3] & 0xff) >>> 7)) & 0x1f];
  chars[15] = C[((entropy[3] & 0xff) >>> 2) & 0x1f];
  chars[16] = C[((entropy[3] << 3) | ((entropy[4] & 0xff) >>> 5)) & 0x1f];
  chars[17] = C[entropy[4] & 0x1f];
  chars[18] = C[(entropy[5] & 0xff) >>> 3];
  chars[19] = C[((entropy[5] << 2) | ((entropy[6] & 0xff) >>> 6)) & 0x1f];
  chars[20] = C[((entropy[6] & 0xff) >>> 1) & 0x1f];
  chars[21] = C[((entropy[6] << 4) | ((entropy[7] & 0xff) >>> 4)) & 0x1f];
  chars[22] = C[((entropy[7] << 1) | ((entropy[8] & 0xff) >>> 7)) & 0x1f];
  chars[23] = C[((entropy[8] & 0xff) >>> 2) & 0x1f];
  chars[24] = C[((entropy[8] << 3) | ((entropy[9] & 0xff) >>> 5)) & 0x1f];
  chars[25] = C[entropy[9] & 0x1f];

  return chars;
}

export function random(): u8[] {
  return generate(systemTime(), randomEntropy());
}

let lastEntropy: StaticArray<u8> = new StaticArray<u8>(ENTROPY_LENGTH);
let lastSystemTime: i64 = -1;

export function monotonic(time: i64 = systemTime()): u8[] {
  if (time < MIN_TIME || time > MAX_TIME) {
    return [];
  }
  let entropy: u8[];
  if (lastSystemTime !== -1 && time === lastSystemTime) {
    /** Increment last entropy */
    let overflow = false;
    for (let i = 9; i >= 0; i--) {
      if (lastEntropy[i] == 0xff) {
        lastEntropy[i] = 0x00;
        overflow = true;
      } else {
        lastEntropy[i] = lastEntropy[i] + 1;
        overflow = false;
        break;
      }
    }
  } else {
    const entropy = randomEntropy();
    if (entropy.length < ENTROPY_LENGTH) {
      return [];
    }
    for (let i: i32 = 0; i < ENTROPY_LENGTH; i++) {
      lastEntropy[i] = entropy[i];
    }
    lastSystemTime = time;
  }
  return generate(time, lastEntropy.slice(0));
}