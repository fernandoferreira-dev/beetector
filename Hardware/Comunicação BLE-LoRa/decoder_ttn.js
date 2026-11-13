// Payload formatter (uplink)
function decodeUplink(input) {
  var b = input.bytes;
  if (b.length < 6) {
    return { errors: ["Payload demasiado curto"] };
  }

  var t10 = ((b[0] | (b[1] << 8)) << 16) >> 16;   // int16 com sinal
  var sound = (b[3] << 24) >> 24;                 // int8 com sinal

  return {
    data: {
      temperature: t10 === 0x7FFF ? null : t10 / 10,
      humidity: b[2] === 0xFF ? null : b[2],
      sound_dbfs: sound,
      beam_count: b[4] | (b[5] << 8)
    }
  };
}
