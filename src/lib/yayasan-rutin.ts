export type YayasanRoutineItem = {
  name: string;
  amount: number;
  note?: string;
  done?: boolean;
};

export type YayasanRoutineGroup = {
  key: string;
  title: string;
  due_day: number;
  reminder_day: number;
  notes?: string;
  items: YayasanRoutineItem[];
};

export const DEFAULT_YAYASAN_ROUTINE_GROUPS: YayasanRoutineGroup[] = [
  {
    key: "gaji",
    title: "Gaji",
    due_day: 1,
    reminder_day: 28,
    items: [
      { name: "Angkasa", amount: 10000000, note: "SMBORO, SMR, TPL" },
      { name: "Sandi", amount: 10000000, note: "Yayasan" },
      { name: "Fahmi", amount: 5000000, note: "SRD, KRS, SMPG, LARA" },
      { name: "Ikhsan", amount: 4000000, note: "KURBAS, DIPO" },
      { name: "Ramli", amount: 3000000, note: "KENJE" },
      { name: "Fajrin", amount: 3000000, note: "BUDONG2" },
      { name: "PT Wari", amount: 3000000, note: "Yayasan" },
      { name: "Dilla", amount: 3000000, note: "Yayasan" },
    ],
  },
  {
    key: "prioritas",
    title: "Bulanan Yayasan Prioritas",
    due_day: 3,
    reminder_day: 1,
    items: [
      { name: "A Anshar", amount: 36000000, note: "Bagi hasil yayasan, Sumare" },
      { name: "Hasri", amount: 36000000, note: "Bagi hasil yayasan, Lara" },
      { name: "Awal", amount: 35000000, note: "Sewa, bagi hasil, bonus, Budong" },
      { name: "Nirma", amount: 15000000, note: "Sewa, Karossa" },
      { name: "Idris", amount: 15000000, note: "Sewa, Sampaga" },
      { name: "Suharni", amount: 15000000, note: "Bagi hasil, Yayasan" },
      { name: "Jasman", amount: 15000000, note: "Bagi hasil, Yayasan" },
      { name: "Kartini", amount: 10000000, note: "Bagi hasil, Yayasan" },
    ],
  },
  {
    key: "kost",
    title: "Kost",
    due_day: 5,
    reminder_day: 3,
    items: [
      { name: "Koki", amount: 600000, note: "Simboro, x3 = 1,8" },
      { name: "Mia", amount: 600000, note: "Dipo" },
      { name: "Sarudu AK, AG", amount: 1000000, note: "Sarudu" },
      { name: "Sarudu Ikky", amount: 1000000, note: "Sarudu" },
    ],
  },
  {
    key: "rumah",
    title: "Rumah",
    due_day: 7,
    reminder_day: 5,
    items: [
      { name: "GC", amount: 6700000, note: "Angsuran ke 4" },
      { name: "Harves B16", amount: 30650000, note: "Angsuran ke 4" },
      { name: "Harves B15", amount: 30650000, note: "Angsuran ke 2" },
    ],
  },
  {
    key: "wifi",
    title: "Wifi",
    due_day: 10,
    reminder_day: 8,
    items: [
      { name: "Balla Ta'", amount: 365000 },
      { name: "Villa", amount: 305000 },
      { name: "Herlang", amount: 200000 },
    ],
  },
  {
    key: "kur",
    title: "KUR",
    due_day: 10,
    reminder_day: 8,
    items: [
      { name: "Rangas Beach", amount: 9700000 },
      { name: "Puang", amount: 9700000 },
      { name: "Abu, Ria, Pardi, Akbar", amount: 4080000 },
    ],
  },
  {
    key: "investasi_bonus",
    title: "Investasi / Bonus",
    due_day: 12,
    reminder_day: 10,
    items: [
      { name: "Irsam", amount: 72000000 },
      { name: "Risal", amount: 15000000 },
      { name: "Bakri", amount: 20000000 },
      { name: "Supran", amount: 9000000, note: "Nominal sheet: 180.000.000, total bayar: 9.000.000" },
    ],
  },
  {
    key: "bonus_kepala_sppg",
    title: "Bonus Kepala SPPG",
    due_day: 15,
    reminder_day: 13,
    items: [
      { name: "Simboro", amount: 6000000 },
      { name: "Dipo", amount: 6000000 },
      { name: "Kurbas", amount: 6000000 },
      { name: "Tapalang", amount: 6000000 },
      { name: "Campalegian", amount: 5000000 },
      { name: "Budong2", amount: 6000000 },
      { name: "Sarudu", amount: 6000000 },
      { name: "Sampaga", amount: 6000000 },
      { name: "Karossa", amount: 6000000 },
      { name: "Lara", amount: 5000000 },
      { name: "Sumare", amount: 5000000 },
    ],
  },
  {
    key: "akuntan",
    title: "Akuntan",
    due_day: 18,
    reminder_day: 16,
    items: [
      { name: "Simboro", amount: 5000000 },
      { name: "Dipo", amount: 5000000 },
      { name: "Kurbas", amount: 5000000 },
      { name: "Tapalang", amount: 5000000 },
      { name: "Campalegian", amount: 2500000 },
      { name: "Budong2", amount: 2500000 },
      { name: "Sarudu", amount: 5000000 },
      { name: "Sampaga", amount: 5000000 },
      { name: "Karossa", amount: 5000000 },
      { name: "Lara", amount: 3000000 },
      { name: "Sumare", amount: 3000000 },
    ],
  },
  {
    key: "gizi",
    title: "Gizi",
    due_day: 20,
    reminder_day: 18,
    items: [
      { name: "Simboro", amount: 5000000 },
      { name: "Dipo", amount: 5000000 },
      { name: "Kurbas", amount: 5000000 },
      { name: "Tapalang", amount: 5000000 },
      { name: "Campalegian", amount: 2500000 },
      { name: "Budong2", amount: 2500000 },
      { name: "Sarudu", amount: 5000000 },
      { name: "Sampaga", amount: 5000000 },
      { name: "Karossa", amount: 5000000 },
      { name: "Lara", amount: 3000000 },
      { name: "Sumare", amount: 3000000 },
    ],
  },
];

export function getDefaultYayasanRoutineGroups() {
  return DEFAULT_YAYASAN_ROUTINE_GROUPS.map((group) => ({
    ...group,
    items: group.items.map((item) => ({ ...item })),
  }));
}
