/**
 * Calcula el precio unitario aplicando descuentos por volumen
 */
export function calculateUnitPriceWithDiscount(
  basePrice: number,
  quantity: number,
  discounts: {
    discount_3u?: number | null;
    discount_5u?: number | null;
    discount_8u?: number | null;
    discount_10u?: number | null;
  }
): number {
  let applicableDiscount = 0;

  // Aplicar el descuento más alto que corresponda según la cantidad
  if (quantity >= 10 && discounts.discount_10u) {
    applicableDiscount = discounts.discount_10u;
  } else if (quantity >= 8 && discounts.discount_8u) {
    applicableDiscount = discounts.discount_8u;
  } else if (quantity >= 5 && discounts.discount_5u) {
    applicableDiscount = discounts.discount_5u;
  } else if (quantity >= 3 && discounts.discount_3u) {
    applicableDiscount = discounts.discount_3u;
  }

  // Calcular el precio con descuento (descuento es porcentaje)
  const discountMultiplier = 1 - (applicableDiscount / 100);
  return basePrice * discountMultiplier;
}

/**
 * Calcula el total del pedido aplicando descuentos por volumen
 */
export function calculateOrderTotal(
  basePrice: number,
  quantity: number,
  discounts: {
    discount_3u?: number | null;
    discount_5u?: number | null;
    discount_8u?: number | null;
    discount_10u?: number | null;
  }
): number {
  const unitPriceWithDiscount = calculateUnitPriceWithDiscount(basePrice, quantity, discounts);
  return unitPriceWithDiscount * quantity;
}

/**
 * Obtiene el descuento aplicable para una cantidad dada
 */
export function getApplicableDiscount(
  quantity: number,
  discounts: {
    discount_3u?: number | null;
    discount_5u?: number | null;
    discount_8u?: number | null;
    discount_10u?: number | null;
  }
): number {
  if (quantity >= 10 && discounts.discount_10u) {
    return discounts.discount_10u;
  } else if (quantity >= 8 && discounts.discount_8u) {
    return discounts.discount_8u;
  } else if (quantity >= 5 && discounts.discount_5u) {
    return discounts.discount_5u;
  } else if (quantity >= 3 && discounts.discount_3u) {
    return discounts.discount_3u;
  }
  return 0;
}
