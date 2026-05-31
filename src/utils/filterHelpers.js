export const normalizeText = (value) => {
  return value?.toString().toLowerCase().trim() || "";
};

export const normalizeWeight = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  const cleaned = value
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();

  const rawNumeric = cleaned.replace(/[^0-9.]/g, "");
  const parsed = parseFloat(rawNumeric);

  if (Number.isFinite(parsed)) {
    const normalizedNumber = parseFloat(parsed.toString());
    return `${normalizedNumber}g`;
  }

  return cleaned;
};

export const normalizeWeightList = (value) => {
  if (!value && value !== 0) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map(normalizeWeight).filter(Boolean);
  }

  return value
    .toString()
    .split(/[,;]+/)
    .map(normalizeWeight)
    .filter(Boolean);
};

export const matchesCategory = (productCategory, selectedCategory) => {
  const normalizedCategory = normalizeText(productCategory);
  const normalizedSelected = normalizeText(selectedCategory);
  return !normalizedSelected || normalizedCategory === normalizedSelected;
};

export const matchesWeight = (productWeight, selectedWeights) => {
  const normalizedProductWeights = normalizeWeightList(productWeight);
  const normalizedSelectedWeights = normalizeWeightList(selectedWeights);
  if (normalizedSelectedWeights.length === 0) {
    return true;
  }
  return normalizedSelectedWeights.some((weight) => normalizedProductWeights.includes(weight));
};
