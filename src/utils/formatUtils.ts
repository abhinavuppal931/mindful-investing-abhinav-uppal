
export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return 'N/A';
  }
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch (error) {
    console.warn('Error formatting currency:', error);
    return 'N/A';
  }
};

export const formatNumber = (value: number | null | undefined, decimals: number = 2): string => {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return 'N/A';
  }
  
  try {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  } catch (error) {
    console.warn('Error formatting number:', error);
    return 'N/A';
  }
};

export const formatLargeNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return 'N/A';
  }
  
  try {
    if (Math.abs(value) >= 1e12) {
      return `$${(value / 1e12).toLocaleString('en-US', { maximumFractionDigits: 2 })}T`;
    } else if (Math.abs(value) >= 1e9) {
      return `$${(value / 1e9).toLocaleString('en-US', { maximumFractionDigits: 2 })}B`;
    } else if (Math.abs(value) >= 1e6) {
      return `$${(value / 1e6).toLocaleString('en-US', { maximumFractionDigits: 2 })}M`;
    } else {
      return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    }
  } catch (error) {
    console.warn('Error formatting large number:', error);
    return 'N/A';
  }
};

export const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return 'N/A';
  }
  
  try {
    return `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}%`;
  } catch (error) {
    console.warn('Error formatting percentage:', error);
    return 'N/A';
  }
};

export const formatPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return 'N/A';
  }
  
  try {
    return `${(value * 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}%`;
  } catch (error) {
    console.warn('Error formatting percent:', error);
    return 'N/A';
  }
};
