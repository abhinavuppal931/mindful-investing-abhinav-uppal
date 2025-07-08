
export interface AnalystRating {
  symbol: string;
  date: string;
  analystRatingsStrongBuy: number;
  analystRatingsBuy: number;
  analystRatingsHold: number;
  analystRatingsSell: number;
  analystRatingsStrongSell: number;
  analystRatingsstrongBuy: number;
  analystRatingsbuy: number;
  analystRatingshold: number;
  analystRatingssell: number;
  analystRatingsstrongSell: number;
  consensus: string;
}

export interface PriceTarget {
  symbol: string;
  targetHigh: number;
  targetLow: number;
  targetConsensus: number;
  targetMedian: number;
}
