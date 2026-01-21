import { supabase } from "@/integrations/supabase/client";

/**
 * Generates a unique order reference in format LZ-YYYY-XXX
 * Example: LZ-2026-001, LZ-2026-002, etc.
 *
 * The sequence resets each year and is globally unique within that year.
 */
export const generateOrderReference = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `LZ-${year}-`;

  // Query the highest sequence number for this year
  const { data, error } = await supabase
    .from('orders')
    .select('order_reference')
    .like('order_reference', `${prefix}%`)
    .order('order_reference', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching last order reference:', error);
    // Fallback: generate with timestamp to ensure uniqueness
    const timestamp = Date.now().toString(36).toUpperCase();
    return `${prefix}${timestamp}`;
  }

  let sequence = 1;
  if (data && data.length > 0 && data[0].order_reference) {
    const lastRef = data[0].order_reference;
    const parts = lastRef.split('-');
    if (parts.length === 3) {
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }
  }

  // Pad sequence to 3 digits (supports up to 999 orders per year)
  // If needed, we can extend to 4 digits for larger volumes
  const paddedSequence = String(sequence).padStart(3, '0');

  return `${prefix}${paddedSequence}`;
};

/**
 * Validates if a string is a valid order reference format
 */
export const isValidOrderReference = (ref: string): boolean => {
  const pattern = /^LZ-\d{4}-\d{3,4}$/;
  return pattern.test(ref);
};

/**
 * Parses an order reference into its components
 */
export const parseOrderReference = (ref: string): { year: number; sequence: number } | null => {
  if (!isValidOrderReference(ref)) {
    return null;
  }

  const parts = ref.split('-');
  return {
    year: parseInt(parts[1], 10),
    sequence: parseInt(parts[2], 10)
  };
};
