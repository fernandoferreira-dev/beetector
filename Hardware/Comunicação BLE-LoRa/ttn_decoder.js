var ESTADOS = ["SEM_SINAL", "CALMA", "ATIVA", "SEM_RAINHA", "ALARME"];
var REC_SIZE = 11;

function hex2(v) {
  return (v < 16 ? "0" : "") + v.toString(16);
}

function decodeRecord(b, o) {
  var t10 = ((b[o] | (b[o + 1] << 8)) << 16) >> 16;   // int16 com sinal
  var sound = (b[o + 3] << 24) >> 24;                  // int8 com sinal
  var worst = b[o + 6] & 0x0F;
  var last = (b[o + 6] >> 4) & 0x0F;

  var rec = {
    temperature: t10 === 0x7FFF ? null : t10 / 10,
    humidity: b[o + 2] === 0xFF ? null : b[o + 2],
    sound_dbfs: sound,
    bee_count: b[o + 4] | (b[o + 5] << 8),
    state_worst_code: worst,
    state_worst: ESTADOS[worst],
    state_last_code: last,
    state_last: ESTADOS[last],
    freq_hz: b[o + 7] * 4
  };

  // Registos novos têm o ID da colmeia (últimos 3 bytes do MAC BLE do C6)
  if (b.length - o >= REC_SIZE) {
    rec.hive_id = hex2(b[o + 8]) + hex2(b[o + 9]) + hex2(b[o + 10]);
  }
  return rec;
}

function decodeUplink(input) {
  var b = input.bytes;

  // Formato novo: N registos de 11 bytes
  if (b.length >= REC_SIZE && b.length % REC_SIZE === 0) {
    var hives = [];
    for (var o = 0; o < b.length; o += REC_SIZE) {
      hives.push(decodeRecord(b, o));
    }
    return { data: { hive_count: hives.length, hives: hives } };
  }

  // Formato antigo (uma colmeia, 6 a 8 bytes, sem ID)
  if (b.length >= 6 && b.length < REC_SIZE) {
    var padded = b.slice();
    while (padded.length < 8) padded.push(0);
    var rec = decodeRecord(padded, 0);
    if (b.length < 8) {
      delete rec.state_worst_code; delete rec.state_worst;
      delete rec.state_last_code;  delete rec.state_last;
      delete rec.freq_hz;
    }
    return { data: rec };
  }

  return { errors: ["Tamanho de payload inválido: " + b.length] };
}
