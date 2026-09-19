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

  wallet: {
    defaultName: 'Tunai',
    totalSaldo: 'Total Saldo',
    hideBalance: 'Sembunyikan saldo',
    showBalance: 'Tampilkan saldo',
    hidden: '••••••',
    yourWallets: 'Dompet Anda',
    addTitle: 'Tambah Dompet',
    editTitle: 'Ubah Dompet',
    name: 'Nama',
    namePlaceholder: 'mis. BCA, GoPay, Dompet',
    type: 'Jenis',
    initialBalance: 'Saldo awal',
    accountNumber: 'Nomor rekening',
    accountNumberPlaceholder: 'mis. 1234567890 (opsional)',
    noAccountNumber: 'Belum ada nomor rekening',
    copy: 'Salin',
    copied: 'Tersalin!',
    owed: 'terutang',
    emptyTitle: 'Belum ada dompet.',
    emptyHint: 'Tambahkan rekening, e-wallet, atau tunai.',
    addButton: 'Tambah Dompet',
    selectWallet: 'Pilih dompet…',
    walletLabel: 'Dompet',
    nameRequired: 'Masukkan nama dompet.',
    balanceInvalid: 'Masukkan saldo yang valid.',
    deleteTitle: 'Hapus dompet?',
    deleteMsg: (name, n) =>
      n > 0
        ? `Hapus "${name}"? ${n} transaksi akan dipindahkan ke dompet utama.`
        : `Hapus "${name}"?`,
    cannotDeleteLast: 'Tidak bisa menghapus dompet terakhir.',
    primaryBadge: 'UTAMA',
    setPrimary: 'Jadikan Utama',
    actionsAria: 'Aksi dompet',
    types: {
      bank: 'Bank',
      ewallet: 'E-Wallet',
      cash: 'Tunai',
      credit: 'Kartu Kredit',
    },
  },

  errors: {
    loadFailed: 'Gagal memuat data tersimpan; memulai dari awal.',
    txSaveFailed: 'Gagal menyimpan transaksi.',
    txUpdateFailed: 'Gagal memperbarui transaksi.',
    txDeleteFailed: 'Gagal menghapus transaksi.',
    categorySaveFailed: 'Gagal menyimpan kategori.',
    categoryDeleteFailed: 'Gagal menghapus kategori.',
    walletSaveFailed: 'Gagal menyimpan dompet.',
    walletUpdateFailed: 'Gagal memperbarui dompet.',
    walletDeleteFailed: 'Gagal menghapus dompet.',
    budgetSaveFailed: 'Gagal menyimpan budget.',
  },

  budget: {
    title: 'Atur Budget',
    monthlyIncome: 'Pemasukan bulanan',
    monthlyIncomeHint: 'Perkiraan pemasukan Anda tiap bulan',
    method: 'Metode',
    methodPercentage: 'Persentase',
    methodFixed: 'Nominal Tetap',
    // groups
    needs: 'Kebutuhan',
    wants: 'Keinginan',
    savings: 'Tabungan',
    groupsTitle: 'Alokasi 50/30/20',
    mustTotal100: 'Total persentase harus 100%.',
    total: (n) => `Total: ${n}%`,
    // category assignment
    assignTitle: 'Kelompok Kategori',
    assignHint: 'Tetapkan tiap kategori ke salah satu kelompok.',
    noGroup: 'Belum diatur',
    // progress
    progressTitle: 'Progres Budget Bulan Ini',
    noBudgetTitle: 'Budget belum diatur.',
    noBudgetHint: 'Atur pemasukan bulanan dan alokasi untuk mulai.',
    spentOf: (spent, limit) => `${spent} dari ${limit}`,
    overBudget: 'Melebihi budget',
    perCategoryFixed: 'Budget per Kategori',
    perCategoryFixedHint: 'Tetapkan nominal budget untuk tiap kategori.',
    saved: 'Tersimpan',
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
    // search + filters
    searchPlaceholder: 'Cari catatan…',
    searchAria: 'Cari transaksi',
    filterButton: 'Filter',
    filterTitle: 'Filter Transaksi',
    dateFrom: 'Dari tanggal',
    dateTo: 'Sampai tanggal',
    filterWallet: 'Dompet',
    filterType: 'Jenis',
    allWallets: 'Semua dompet',
    allTypes: 'Semua jenis',
    applyFilters: 'Terapkan',
    resetFilters: 'Atur ulang',
    activeFilters: (n) => `${n} filter aktif`,
    resultCount: (n) => `${n} transaksi`,
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
