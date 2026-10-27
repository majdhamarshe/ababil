export const deliveryGroups = [
  {
    label: 'الضفة الغربية',
    fee: 20,
    regions: [
      'جنين',
      'طوباس والأغوار الشمالية',
      'طولكرم',
      'نابلس',
      'قلقيلية',
      'سلفيت',
      'رام الله والبيرة',
      'أريحا والأغوار',
      'بيت لحم',
      'الخليل',
    ],
  },
  { label: 'القدس', fee: 50, regions: ['القدس'] },
  { label: 'الداخل المحتل', fee: 70, regions: ['الداخل المحتل'] },
];

export function deliveryForRegion(region) {
  return deliveryGroups.find((group) => group.regions.includes(region)) ?? null;
}
