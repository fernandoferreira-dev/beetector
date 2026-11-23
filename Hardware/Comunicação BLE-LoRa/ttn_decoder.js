var ESTADOS = ["SEM_SINAL", "CALMA", "ATIVA", "SEM_RAINHA", "ALARME"];
var REC_NEW = 13;   // registo novo: 11 bytes de dados + 2 de bateria
var REC_OLD = 11;   // registo antigo (sem bateria)

// Curva tipica de uma LiPo de 1 celula (mV -> %)
var BAT_CURVA = [
  [4200, 100], [4150, 95], [4110, 90], [4080, 85], [4020, 80], [3980, 75],
  [3950, 70], [3910, 65], [3870, 60], [3850, 55], [3840, 50], [3820, 45],
  [3800, 40], [3790, 35], [3770, 30], [3750, 25], [3730, 20], [3710, 15],
  [3690, 10], [3610, 5], [3270, 0]
];

function hex2(v) {
  return (v < 16 ? "0" : "") + v.toString(16);
}

function u16(b, o) {
  return b[o] | (b[o + 1] << 8);
}

// 0xFFFF = sem bateria / divisor nao ligado
function batMv(b, o) {
  var v = u16(b, o);
  return v === 0xFFFF ? null : v;
}

function batPct(mv) {
  if (mv === null) return null;
  if (mv >= BAT_CURVA[0][0]) return 100;
  for (var i = 1; i < BAT_CURVA.length; i++) {
    var hi = BAT_CURVA[i - 1];
    var lo = BAT_CURVA[i];
    if (mv >= lo[0]) {
      return Math.round(lo[1] + (hi[1] - lo[1]) * (mv - lo[0]) / (hi[0] - lo[0]));
    }
  }
  return 0;
}

function decodeRecord(b, o, comBateria) {
  var t10 = ((b[o] | (b[o + 1] << 8)) << 16) >> 16;   // int16 com sinal
  var sound = (b[o + 3] << 24) >> 24;                  // int8 com sinal
  var worst = b[o + 6] & 0x0F;
  var last = (b[o + 6] >> 4) & 0x0F;

  var rec = {
    hive_id: hex2(b[o + 8]) + hex2(b[o + 9]) + hex2(b[o + 10]),
    temperature: t10 === 0x7FFF ? null : t10 / 10,
    humidity: b[o + 2] === 0xFF ? null : b[o + 2],
    sound_dbfs: sound,
    bee_count: u16(b, o + 4),
    state_worst_code: worst,
    state_worst: ESTADOS[worst],
    state_last_code: last,
    state_last: ESTADOS[last],
    freq_hz: b[o + 7] * 4
  };

  if (comBateria) {
    var mv = batMv(b, o + 11);
    rec.battery_mv = mv;
    rec.battery_pct = batPct(mv);
  }
  return rec;
}

function decodeUplink(input) {
  var b = input.bytes;
  var n = b.length;
  var i;

  // Formato atual: 2 bytes (bateria do S3) + N registos de 13 bytes
  if (n >= 2 + REC_NEW && (n - 2) % REC_NEW === 0) {
    var gmv = batMv(b, 0);
    var hives = [];
    for (i = 2; i < n; i += REC_NEW) hives.push(decodeRecord(b, i, true));
    return {
      data: {
        gateway_battery_mv: gmv,
        gateway_battery_pct: batPct(gmv),
        hive_count: hives.length,
        hives: hives
      }
    };
  }

  // Formato anterior: N registos de 11 bytes, sem bateria
  if (n >= REC_OLD && n % REC_OLD === 0) {
    var old = [];
    for (i = 0; i < n; i += REC_OLD) old.push(decodeRecord(b, i, false));
    return { data: { hive_count: old.length, hives: old } };
  }

  return { errors: ["Tamanho de payload invalido: " + n] };
}