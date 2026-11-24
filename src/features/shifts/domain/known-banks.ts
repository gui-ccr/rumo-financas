/** A bank or digital wallet whose Android package the app knows by name. */
export type KnownBank = { id: string; name: string; packageName: string };

export const KNOWN_BANKS: readonly KnownBank[] = [
  { id: 'nubank', name: 'Nubank', packageName: 'com.nu.production' },
  { id: 'inter', name: 'Inter', packageName: 'br.com.intermedium' },
  { id: 'picpay', name: 'PicPay', packageName: 'com.picpay' },
  { id: 'mercadopago', name: 'Mercado Pago', packageName: 'com.mercadopago.wallet' },
  { id: 'c6', name: 'C6 Bank', packageName: 'com.c6bank.app' },
  { id: 'itau', name: 'Itaú', packageName: 'com.itau' },
  { id: 'bradesco', name: 'Bradesco', packageName: 'com.bradesco' },
  { id: 'santander', name: 'Santander', packageName: 'com.santander.app' },
  { id: 'bb', name: 'Banco do Brasil', packageName: 'br.com.bb.android' },
  { id: 'caixa', name: 'Caixa', packageName: 'br.com.gabba.Caixa' },
  { id: 'pagbank', name: 'PagBank', packageName: 'br.com.uol.ps.myaccount' },
];

/** The known bank that owns this package (case-insensitive), or null for any other app. */
export function bankForPackage(packageName: string): KnownBank | null {
  const key = packageName.trim().toLowerCase();
  return KNOWN_BANKS.find((bank) => bank.packageName.toLowerCase() === key) ?? null;
}

/** Friendly name of the known bank for this package, or null when the package is not a known bank. */
export function bankNameForPackage(packageName: string): string | null {
  return bankForPackage(packageName)?.name ?? null;
}
