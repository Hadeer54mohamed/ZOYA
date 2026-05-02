export const SHIPPING_FEES = {
  // القاهرة الكبرى
  Cairo: 60,
  Giza: 60,
  Qalyubia: 60,

  // الإسكندرية ومدن القناة
  Alexandria: 70,
  Suez: 70,
  Ismailia: 70,
  "Port Said": 70,

  // محافظات الدلتا
  Dakahlia: 65,
  Sharqia: 65,
  Gharbia: 65,
  Monufia: 65,
  "Kafr El Sheikh": 70,
  Beheira: 70,
  Damietta: 70,

  // شمال الصعيد
  Fayoum: 75,
  "Beni Suef": 75,
  Minya: 80,

  // وسط وجنوب الصعيد
  Assiut: 80,
  Sohag: 85,
  Qena: 90,
  Luxor: 95,
  Aswan: 100,

  // المحافظات الحدودية والبعيدة
  "Red Sea": 100,
  Matrouh: 100,
  "New Valley": 120,
  "North Sinai": 120,
  "South Sinai": 120,
};

export function getShippingFee(governorate) {
  if (!governorate) return 0;
  return SHIPPING_FEES[governorate] ?? 0;
}

export function isValidGovernorate(governorate) {
  return Boolean(governorate) && governorate in SHIPPING_FEES;
}
