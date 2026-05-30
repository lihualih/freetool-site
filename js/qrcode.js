/**
 * Minimal QR Code Generator
 * Supports byte mode encoding with EC levels L/M/Q/H
 * Generates QR code matrices for canvas rendering
 */

const QRCode = (function() {
  // Error correction codewords per block
  const EC_TABLES = {
    L: { 1: {ec:7,total:26,blocks:[{count:1,data:19}]}, 2: {ec:10,total:44,blocks:[{count:1,data:34}]}, 3: {ec:15,total:70,blocks:[{count:1,data:55}]}, 4: {ec:20,total:100,blocks:[{count:1,data:80}]}, 5: {ec:26,total:134,blocks:[{count:1,data:108}]}, 6: {ec:18,total:172,blocks:[{count:2,data:68}]}, 7: {ec:20,total:196,blocks:[{count:2,data:78}]}, 8: {ec:24,total:242,blocks:[{count:2,data:97}]}, 9: {ec:30,total:292,blocks:[{count:2,data:116}]}, 10: {ec:18,total:346,blocks:[{count:2,ec:2,data:68},{count:2,data:69}]} },
    M: { 1: {ec:10,total:26,blocks:[{count:1,data:16}]}, 2: {ec:16,total:44,blocks:[{count:1,data:28}]}, 3: {ec:26,total:70,blocks:[{count:1,data:44}]}, 4: {ec:18,total:100,blocks:[{count:2,data:32}]}, 5: {ec:24,total:134,blocks:[{count:2,data:43}]}, 6: {ec:16,total:172,blocks:[{count:4,data:27}]}, 7: {ec:18,total:196,blocks:[{count:4,data:31}]}, 8: {ec:22,total:242,blocks:[{count:2,data:38},{count:2,data:39}]}, 9: {ec:22,total:292,blocks:[{count:3,data:36},{count:2,data:37}]}, 10: {ec:26,total:346,blocks:[{count:4,data:43},{count:1,data:44}]} },
    Q: { 1: {ec:13,total:26,blocks:[{count:1,data:13}]}, 2: {ec:22,total:44,blocks:[{count:1,data:22}]}, 3: {ec:18,total:70,blocks:[{count:2,data:17}]}, 4: {ec:26,total:100,blocks:[{count:2,data:24}]}, 5: {ec:18,total:134,blocks:[{count:2,data:15},{count:2,data:16}]}, 6: {ec:24,total:172,blocks:[{count:4,data:19}]}, 7: {ec:18,total:196,blocks:[{count:4,data:14},{count:1,data:15}]}, 8: {ec:22,total:242,blocks:[{count:4,data:18},{count:1,data:19}]}, 9: {ec:20,total:292,blocks:[{count:4,data:14},{count:4,data:15}]}, 10: {ec:24,total:346,blocks:[{count:6,data:13},{count:2,data:14}]} },
    H: { 1: {ec:17,total:26,blocks:[{count:1,data:9}]}, 2: {ec:28,total:44,blocks:[{count:1,data:16}]}, 3: {ec:22,total:70,blocks:[{count:2,data:13}]}, 4: {ec:16,total:100,blocks:[{count:2,data:9},{count:2,data:10}]}, 5: {ec:22,total:134,blocks:[{count:2,data:11},{count:2,data:12}]}, 6: {ec:28,total:172,blocks:[{count:4,data:15}]}, 7: {ec:26,total:196,blocks:[{count:4,data:13},{count:1,data:14}]}, 8: {ec:24,total:242,blocks:[{count:4,data:14},{count:2,data:15}]}, 9: {ec:22,total:292,blocks:[{count:4,data:12},{count:4,data:13}]}, 10: {ec:22,total:346,blocks:[{count:3,data:15},{count:5,data:16}]} }
  };

  // GF(256) operations for Reed-Solomon
  const GF_EXP = new Array(512);
  const GF_LOG = new Array(256);
  (function() {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      GF_EXP[i] = x;
      GF_LOG[x] = i;
      x <<= 1;
      if (x & 256) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
  })();

  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return GF_EXP[GF_LOG[a] + GF_LOG[b]];
  }

  function rsGenPoly(nsym) {
    let g = [1];
    for (let i = 0; i < nsym; i++) {
      const ng = new Array(g.length + 1).fill(0);
      for (let j = 0; j < g.length; j++) {
        ng[j] ^= g[j];
        ng[j + 1] ^= gfMul(g[j], GF_EXP[i]);
      }
      g = ng;
    }
    return g;
  }

  function rsEncode(data, nsym) {
    const gen = rsGenPoly(nsym);
    const res = new Array(data.length + nsym).fill(0);
    for (let i = 0; i < data.length; i++) res[i] = data[i];
    for (let i = 0; i < data.length; i++) {
      const coef = res[i];
      if (coef !== 0) {
        for (let j = 0; j < gen.length; j++) {
          res[i + j] ^= gfMul(gen[j], coef);
        }
      }
    }
    return res.slice(data.length);
  }

  // Encoding capacities (byte mode)
  const CAPACITIES = [0,17,32,53,78,106,134,154,192,230,271,321,367,425,458,520,586,644,718,792,858,929,1003,1091,1171,1273,1367,1465,1528,1628,1732,1840,1952,2068,2188,2303,2431,2563,2699,2809,2953];

  function getVersion(dataLen, ecLevel) {
    const tables = EC_TABLES[ecLevel];
    for (let v = 1; v <= 10; v++) {
      const t = tables[v];
      if (!t) continue;
      const capacity = t.blocks.reduce((s, b) => s + b.data, 0) - 2; // mode+count overhead
      if (dataLen <= capacity) return v;
    }
    return -1;
  }

  function encode(text) {
    const encoder = new TextEncoder();
    const bytes = Array.from(encoder.encode(text));
    return bytes;
  }

  function buildDataCodewords(bytes, version, ecLevel) {
    const tables = EC_TABLES[ecLevel][version];
    const totalDataCW = tables.blocks.reduce((s, b) => s + b.data, 0);

    // Mode indicator (byte = 0100) + character count
    const bits = [];
    bits.push(0, 1, 0, 0); // byte mode

    const countBits = version <= 9 ? 8 : 16;
    for (let i = countBits - 1; i >= 0; i--) bits.push((bytes.length >> i) & 1);

    for (const b of bytes) {
      for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
    }

    // Terminator
    const maxBits = totalDataCW * 8;
    for (let i = 0; i < 4 && bits.length < maxBits; i++) bits.push(0);

    // Pad to byte
    while (bits.length % 8 !== 0) bits.push(0);

    // Pad codewords
    const padCW = [0xEC, 0x11];
    let pi = 0;
    while (bits.length < maxBits) {
      for (let i = 7; i >= 0; i--) bits.push((padCW[pi % 2] >> i) & 1);
      pi++;
    }

    // Convert to bytes
    const codewords = [];
    for (let i = 0; i < bits.length; i += 8) {
      let val = 0;
      for (let j = 0; j < 8; j++) val = (val << 1) | (bits[i + j] || 0);
      codewords.push(val);
    }

    return codewords;
  }

  function interleaveBlocks(dataCW, version, ecLevel) {
    const tables = EC_TABLES[ecLevel][version];
    const blocks = [];
    let offset = 0;

    for (const block of tables.blocks) {
      for (let i = 0; i < block.count; i++) {
        const blockData = dataCW.slice(offset, offset + block.data);
        const ecData = rsEncode(blockData, tables.ec);
        blocks.push({ data: blockData, ec: ecData });
        offset += block.data;
      }
    }

    // Interleave data codewords
    const maxDataLen = Math.max(...blocks.map(b => b.data.length));
    const result = [];
    for (let i = 0; i < maxDataLen; i++) {
      for (const block of blocks) {
        if (i < block.data.length) result.push(block.data[i]);
      }
    }

    // Interleave EC codewords
    const maxECLen = tables.ec;
    for (let i = 0; i < maxECLen; i++) {
      for (const block of blocks) {
        if (i < block.ec.length) result.push(block.ec[i]);
      }
    }

    return result;
  }

  // Alignment pattern positions
  const ALIGN_POS = {
    2: [6,18], 3: [6,22], 4: [6,26], 5: [6,30], 6: [6,34],
    7: [6,22,38], 8: [6,24,42], 9: [6,26,46], 10: [6,28,50]
  };

  function createMatrix(version) {
    const size = 17 + version * 4;
    const matrix = Array.from({length: size}, () => Array(size).fill(null));
    const reserved = Array.from({length: size}, () => Array(size).fill(false));

    // Finder patterns
    function placeFinder(r, c) {
      for (let dr = -1; dr <= 7; dr++) {
        for (let dc = -1; dc <= 7; dc++) {
          const rr = r + dr, cc = c + dc;
          if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
          const dark = (dr >= 0 && dr <= 6 && (dc === 0 || dc === 6)) ||
                       (dc >= 0 && dc <= 6 && (dr === 0 || dr === 6)) ||
                       (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4);
          matrix[rr][cc] = dark;
          reserved[rr][cc] = true;
        }
      }
    }

    placeFinder(0, 0);
    placeFinder(0, size - 7);
    placeFinder(size - 7, 0);

    // Alignment patterns
    const ap = ALIGN_POS[version];
    if (ap) {
      for (const r of ap) {
        for (const c of ap) {
          if (reserved[r][c]) continue;
          for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
              const dark = Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0);
              matrix[r + dr][c + dc] = dark;
              reserved[r + dr][c + dc] = true;
            }
          }
        }
      }
    }

    // Timing patterns
    for (let i = 8; i < size - 8; i++) {
      if (!reserved[6][i]) { matrix[6][i] = i % 2 === 0; reserved[6][i] = true; }
      if (!reserved[i][6]) { matrix[i][6] = i % 2 === 0; reserved[i][6] = true; }
    }

    // Dark module
    matrix[size - 8][8] = true;
    reserved[size - 8][8] = true;

    // Reserve format info areas
    for (let i = 0; i < 9; i++) {
      if (!reserved[8][i]) reserved[8][i] = true;
      if (!reserved[i][8]) reserved[i][8] = true;
      if (!reserved[8][size - 1 - i]) reserved[8][size - 1 - i] = true;
      if (!reserved[size - 1 - i][8]) reserved[size - 1 - i][8] = true;
    }

    return { matrix, reserved, size };
  }

  function placeData(matrix, reserved, size, data) {
    let bitIdx = 0;
    const totalBits = data.length * 8;

    // Convert data to bits
    const bits = [];
    for (const byte of data) {
      for (let i = 7; i >= 0; i--) bits.push((byte >> i) & 1);
    }

    // Zigzag placement
    let col = size - 1;
    let upward = true;

    while (col >= 0) {
      if (col === 6) col--; // Skip timing column

      const rows = upward ? Array.from({length: size}, (_, i) => size - 1 - i) : Array.from({length: size}, (_, i) => i);

      for (const row of rows) {
        for (let dc = 0; dc >= -1; dc--) {
          const c = col + dc;
          if (c < 0 || reserved[row][c]) continue;
          if (bitIdx < bits.length) {
            matrix[row][c] = bits[bitIdx] === 1;
            bitIdx++;
          } else {
            matrix[row][c] = false;
          }
        }
      }

      col -= 2;
      upward = !upward;
    }
  }

  function applyMask(matrix, reserved, size, mask) {
    const maskFn = [
      (r, c) => (r + c) % 2 === 0,
      (r, c) => r % 2 === 0,
      (r, c) => c % 3 === 0,
      (r, c) => (r + c) % 3 === 0,
      (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
      (r, c) => ((r * c) % 2 + (r * c) % 3) === 0,
      (r, c) => ((r * c) % 2 + (r * c) % 3) % 2 === 0,
      (r, c) => ((r + c) % 2 + (r * c) % 3) % 2 === 0,
    ][mask];

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!reserved[r][c] && maskFn(r, c)) {
          matrix[r][c] = !matrix[r][c];
        }
      }
    }
  }

  function placeFormatInfo(matrix, size, ecLevel, mask) {
    const ecMap = { L: 1, M: 0, Q: 3, H: 2 };
    const formatBits = [
      0x5412,0x5125,0x5E7C,0x5B4B,0x45F9,0x40CE,0x4F97,0x4AA0,
      0x77C4,0x72F3,0x7DAA,0x789D,0x662F,0x6318,0x6C41,0x6976,
      0x1689,0x13BE,0x1CE7,0x19D0,0x0762,0x0255,0x0D0C,0x083B,
      0x355F,0x3068,0x3F31,0x3A06,0x24B4,0x2183,0x2EDA,0x2BED
    ];
    const info = formatBits[ecMap[ecLevel] * 8 + mask];

    for (let i = 0; i < 15; i++) {
      const bit = ((info >> i) & 1) === 1;
      // Top-left area
      if (i < 6) { matrix[8][i] = bit; }
      else if (i < 8) { matrix[8][i + 1] = bit; }
      else if (i === 8) { matrix[7][8] = bit; }
      else { matrix[14 - i][8] = bit; }

      // Bottom-left and top-right areas
      if (i < 8) { matrix[size - 1 - i][8] = bit; }
      else { matrix[8][size - 15 + i] = bit; }
    }
  }

  function generate(text, ecLevel) {
    ecLevel = ecLevel || 'M';
    const bytes = encode(text);
    const version = getVersion(bytes.length, ecLevel);
    if (version < 0) throw new Error('Text too long');

    const dataCW = buildDataCodewords(bytes, version, ecLevel);
    const allCW = interleaveBlocks(dataCW, version, ecLevel);

    const { matrix, reserved, size } = createMatrix(version);
    placeData(matrix, reserved, size, allCW);
    applyMask(matrix, reserved, size, 0);
    placeFormatInfo(matrix, size, ecLevel, 0);

    return { modules: matrix, size, version };
  }

  return { generate };
})();

// Export for use
if (typeof window !== 'undefined') window.QRCode = QRCode;
