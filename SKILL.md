---
name: xauusd-snr-poi-ocl
description: Menentukan zona Support & Resistance (SNR) yang valid untuk trading XAUUSD (scalping M5/M15) berdasarkan struktur POI-to-POI (Order Block) dan divalidasi lewat OCL (Open-Close Level). Gunakan skill ini setiap kali diminta menandai/menghitung SNR, support-resistance, order block, atau zona valid di chart gold — jangan tandai SNR dari swing high/low mentah tanpa melalui aturan di skill ini.
---

# XAUUSD SNR Detector — POI to POI + OCL Validation

Skill ini mendefinisikan aturan ketat untuk menentukan zona Support & Resistance (SNR) yang **valid**. Prinsip utamanya: **SNR TIDAK BOLEH ditarik dari swing high/low sembarangan** — harus dari satu POI ke POI lain, dan level presisinya divalidasi lewat OCL.

## Definisi Inti

| Istilah | Arti |
|---|---|
| **POI** (Point of Interest) | Order Block (OB) — candle terakhir yang berlawanan arah sebelum terjadi displacement/impulsive leg yang menyebabkan BOS (Break of Structure) atau CHoCH (Change of Character) |
| **OCL** (Open-Close Level) | Range body candle OB (dari harga open ke close), BUKAN wick/high-low. Ini level presisi yang dipakai untuk validasi & mitigasi |
| **SNR** | Zona Support/Resistance yang ditarik dari OCL satu POI ke OCL POI lain yang berdekatan dan masih relevan |
| **FVG** (Fair Value Gap) | Layer confluence opsional — kalau overlap dengan POI, menaikkan confidence zona, bukan syarat wajib |
| **Liquidity Sweep** | Layer confluence opsional — kalau OB terbentuk setelah sweep high/low sebelumnya, zona dapat status "confirmed", bukan syarat wajib |

Kenapa OB jadi basis utama (bukan FVG/liquidity murni): OB paling konsisten muncul di titik reversal dan punya body candle yang jelas — jadi OCL bisa dihitung. FVG lebih jarang muncul persis di titik reversal yang bagus, dan liquidity sweep sifatnya kontekstual (bukan level harga tetap).

## 1. Deteksi POI (Order Block)

1. Cari displacement leg: minimal 2–3 candle impulsif dengan body besar yang menembus structure (BOS/CHoCH) di M5 atau M15.
2. POI candle = candle **terakhir yang berlawanan arah** sebelum leg displacement itu mulai:
   - **Bullish OB** = candle turun (merah) terakhir sebelum leg naik
   - **Bearish OB** = candle naik (hijau) terakhir sebelum leg turun
3. Simpan 2 level dari tiap candle POI:
   - `ocl` = level open & close candle itu (body) → dipakai untuk validasi zona & mitigasi partial
   - `wick` = level high/low candle itu → dipakai untuk mitigasi total (POI dianggap mati/dibuang)

## 2. Membangun Zona SNR (POI to POI)

1. Zona SNR **hanya valid** kalau kedua ujungnya adalah POI (OB) — bukan swing high/low biasa.
2. Tarik zona dari `ocl` POI atas ke `ocl` POI bawah yang **berdekatan dan belum termitigasi**.
3. Prioritaskan pairing POI yang paling dekat dan searah dengan struktur terakhir (biar zona tetap fresh/relevan, bukan POI lama yang udah nggak nyambung ke price action sekarang).
4. Tandai confluence (opsional, tidak wajib untuk validitas dasar):
   - `fvg_overlap: true` kalau ada FVG yang overlap dengan salah satu POI di zona itu
   - `liquidity_confirmed: true` kalau OB terbentuk setelah sweep high/low sebelumnya

## 3. Aturan Validitas & Mitigasi

- **Fresh**: belum pernah disentuh price sejak terbentuk.
- **Tested**: price udah masuk ke zona lewat wick tapi belum close menembus `ocl` — zona MASIH VALID.
- **Mitigated (partial)**: price close menembus `ocl` dari POI di ujung zona → zona dianggap lemah, turunkan prioritas tapi belum langsung dibuang.
- **Mitigated (full)**: price close menembus `wick` (high/low) POI tersebut → POI dianggap mati, buang dari watchlist, cari POI baru untuk re-pair zona.

Urutan cek tiap candle baru: cek full mitigation dulu → kalau nggak, cek partial mitigation → kalau nggak, cek apakah cuma "tested" via wick.

## 4. Format Output

Setiap zona SNR yang valid dilaporkan dalam bentuk berikut (JSON, untuk dipakai lanjut di pipeline/agent):

```json
{
  "zone_id": "SNR-<timeframe>-<index>",
  "timeframe": "M5" | "M15",
  "type": "support" | "resistance",
  "poi_upper": {
    "ocl": 0000.00,
    "wick": 0000.00,
    "ob_type": "bullish_ob" | "bearish_ob",
    "formed_at": "<candle timestamp>"
  },
  "poi_lower": {
    "ocl": 0000.00,
    "wick": 0000.00,
    "ob_type": "bullish_ob" | "bearish_ob",
    "formed_at": "<candle timestamp>"
  },
  "status": "fresh" | "tested" | "mitigated_partial" | "mitigated_full",
  "confluence": {
    "fvg_overlap": true,
    "liquidity_confirmed": false
  }
}
```

## 5. Konteks Multi-Timeframe (M15 → M5)

- Deteksi POI & bangun zona SNR utama di **M15** dulu (struktur besar).
- Di **M5**, cari POI turunan (minor OB) di dalam zona SNR M15 yang masih fresh/tested — ini jadi area sniper entry.
- Zona SNR M5 yang berada **di luar** zona SNR M15 aktif diberi confidence lebih rendah (counter-trend terhadap struktur besar).

## 6. Yang TIDAK Boleh Dilakukan

- Jangan tarik SNR dari swing high/low candlestick biasa tanpa POI di baliknya.
- Jangan pakai full wick range sebagai level validasi utama — itu tugas `ocl`, wick cuma untuk cek mitigasi total.
- Jangan anggap zona valid otomatis invalid hanya karena disentuh wick — cek dulu apakah candle itu close menembus `ocl` atau tidak.
- Jangan wajibkan FVG/liquidity sweep untuk validitas dasar — itu confluence tambahan, bukan syarat.