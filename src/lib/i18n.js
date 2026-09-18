// @ts-check
/**
 * Localization (Req 12). Single default locale: Bahasa Indonesia (`id`).
 * All UI strings live here so wording stays consistent and maintainable.
 * Views import `t` and read nested keys, e.g. `t.nav.beranda`.
 *
 * Some values are functions for interpolation, e.g. `t.tx.deleteMsg(...)`.
 */

export const locale = 'id-ID';

export const t = {
  app: {
    name: 'Pelacak Keuangan',
    loading: 'Memuat…',
    dismiss: 'Tutup',
    cancel: 'Batal',
    confirm: 'Konfirmasi',
    close: 'Tutup',
    save: 'Simpan',
    add: 'Tambah',
    delete: 'Hapus',
    edit: 'Ubah',
    back: 'Kembali',
    clear: 'Hapus filter',
    all: 'Semua',
  },

  nav: {
    beranda: 'Beranda',
    dompet: 'Dompet',
    transaksi: 'Transaksi',
    lainnya: 'Lainnya',
    tambah: 'Tambah',
  },

  header: {
    beranda: 'Beranda',
    dompet: 'Dompet',
    transaksi: 'Transaksi',
    lainnya: 'Lainnya',
    kategori: 'Kategori',
    budget: 'Atur Budget',
    aset: 'Aset',
    utang: 'Utang',
    investasi: 'Investasi',
    laporan: 'Laporan',
  },

  beranda: {
    totalSaldo: 'Total Saldo',
    ringkasanBulan: 'Ringkasan Bulan Ini',
    comingSoon: 'Fitur lain akan hadir di sini.',
    sekilasHariIni: 'Sekilas Hari Ini',
    budgetHarianTersisa: 'budget harian yang tersisa',
    pemasukan: 'PEMASUKAN',
    pengeluaran: 'PENGELUARAN',
    budgetBelumDiatur: 'Atur budget untuk melihat sisa harian',
  },

  dompet: {
    placeholderTitle: 'Dompet akan hadir di tahap berikutnya.',
    placeholderHint: 'Kelola rekening bank, e-wallet, tunai, dan kartu kredit di sini.',
  },

  dashboard: {
    month: 'Bulan',
    income: 'Pemasukan',
    expenses: 'Pengeluaran',
    net: 'Saldo Bersih',
    netForMonth: (month) => `Saldo Bersih — ${month}`,
    spendingByCategory: 'Pengeluaran per Kategori',
  },

  chart: {
    spent: 'Terpakai',
    noExpenses: 'Belum ada pengeluaran bulan ini.',
    ariaLabel: 'Pengeluaran per kategori',
  },

  tx: {
    // form
    addTitle: 'Tambah Transaksi',
    editTitle: 'Ubah Transaksi',
    type: 'Jenis',
    expense: 'Pengeluaran',
    income: 'Pemasukan',
    amount: 'Jumlah',
    amountPlaceholder: '0',
    category: 'Kategori',
    selectCategory: 'Pilih kategori…',
    date: 'Tanggal',
    note: 'Catatan',
    notePlaceholder: 'Catatan (opsional)',
    // list
    filterMonth: 'Bulan',
    filterCategory: 'Kategori',
    filterCategoryAria: 'Saring berdasarkan kategori',
    allCategories: 'Semua kategori',
    count: (n, month) => `${n} transaksi — ${month}`,
    emptyTitle: 'Tidak ada transaksi yang cocok.',
    emptyHint: 'Ketuk + untuk menambah.',
    editAria: 'Ubah transaksi',
    deleteAria: 'Hapus transaksi',
    // delete confirm
    deleteTitle: 'Hapus transaksi?',
    deleteMsg: (typeLabel, amount, category) =>
      `Hapus ${typeLabel} sebesar ${amount} pada ${category}? Tindakan ini tidak dapat dibatalkan.`,
    // date groups
    today: 'Hari Ini',
    yesterday: 'Kemarin',
  },

  validation: {
    amountRequired: 'Masukkan jumlah.',
    amountPositive: 'Jumlah harus berupa angka positif.',
    typeRequired: 'Pilih pemasukan atau pengeluaran.',
    categoryRequired: 'Pilih kategori.',
    categoryInvalid: 'Pilih kategori yang valid.',
    dateInvalid: 'Masukkan tanggal yang valid.',
  },

  category: {
    title: 'Kategori',
    addLabel: 'Tambah kategori',
    newNamePlaceholder: 'Nama kategori baru',
    newNameAria: 'Nama kategori baru',
    yourCategories: 'Kategori Anda',
    defaultBadge: 'Bawaan',
    deleteAria: (name) => `Hapus ${name}`,
    nameRequired: 'Masukkan nama kategori.',
    duplicate: 'Kategori itu sudah ada.',
    deleteTitle: 'Hapus kategori?',
    deleteMsgInUse: (name, n) =>
      `"${name}" dipakai oleh ${n} transaksi. Transaksi tersebut tetap menyimpan kategorinya, tetapi Anda tidak dapat memilihnya lagi. Tetap hapus?`,
    deleteMsgSimple: (name) => `Hapus "${name}"?`,
    unknown: 'Tak diketahui',
  },

  lainnya: {
    title: 'Lainnya',
    subtitle: 'Fitur dan pengaturan lainnya.',
    budget: 'Atur Budget',
    aset: 'Aset',
    utang: 'Utang',
    investasi: 'Investasi',
    laporan: 'Laporan',
    kategori: 'Kelola Kategori',
    soon: 'Segera hadir',
  },

  // Default category display names (used when seeding / re-labeling defaults).
  defaultCategories: {
    food: 'Makanan',
    transport: 'Transportasi',
    rent: 'Sewa',
    bills: 'Tagihan',
    shopping: 'Belanja',
    entertainment: 'Hiburan',
    income: 'Pemasukan',
    other: 'Lainnya',
  },
};

/**
 * Convenience: map a transaction type to its Indonesian label.
 * @param {'income'|'expense'} type
 * @returns {string}
 */
export function typeLabel(type) {
  return type === 'income' ? t.tx.income : t.tx.expense;
}
