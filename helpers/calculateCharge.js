const Zone = require('../models/Zone');

/**
 * Calculates delivery charge based on receiver pincode and parcel weight.
 * Formula: baseFee + (weight * perKgRate)
 * @param {string} pincode
 * @param {number} weight
 * @returns {Promise<{ charge: number, zoneName: string, baseFee: number, perKgRate: number, isDefault: boolean }>}
 */
async function calculateCharge(pincode, weight) {
  const numericWeight = Math.max(0.1, Number(weight) || 1);
  const cleanPincode = String(pincode).trim();

  // Find a zone that contains this pincode
  const zone = await Zone.findOne({ pincodes: cleanPincode });

  if (zone) {
    const charge = Math.round((zone.baseFee + numericWeight * zone.perKgRate) * 100) / 100;
    return {
      charge,
      zoneName: zone.zoneName,
      baseFee: zone.baseFee,
      perKgRate: zone.perKgRate,
      isDefault: false
    };
  }

  // Default fallback if pincode doesn't match any configured zone
  const defaultBaseFee = 100;
  const defaultPerKgRate = 30;
  const charge = Math.round((defaultBaseFee + numericWeight * defaultPerKgRate) * 100) / 100;

  return {
    charge,
    zoneName: 'Standard National Zone (Default)',
    baseFee: defaultBaseFee,
    perKgRate: defaultPerKgRate,
    isDefault: true
  };
}

module.exports = calculateCharge;
