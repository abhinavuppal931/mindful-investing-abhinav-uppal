import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fmpAPI } from '@/services/api';
import { cn } from '@/lib/utils';

// Types for API responses (kept flexible to avoid breaking on API changes)
interface RatingsConsensusItem {
  symbol?: string;
  strongBuy?: number; buy?: number; hold?: number; sell?: number; strongSell?: number;
  total?: number; consensus?: string; grade?: string; [key: string]: any;
}

interface PriceTargetConsensusItem {
  symbol?: string;
  targetLow?: number; targetHigh?: number; targetConsensus?: number; targetMedian?: number;
  [key: string]: any;
}

interface AnalystProps {
  ticker: string;
}

// Gradient helpers
const gradients = {
  strongBuy: 'from-emerald-400 via-emerald-500 to-emerald-600',
  buy: 'from-green-400 via-green-500 to-green-600',
  hold: 'from-amber-400 via-amber-500 to-amber-600',
  sell: 'from-red-400 via-red-500 to-red-600',
  strongSell: 'from-red-600 via-red-700 to-red-800',
};

const labelOrder = ['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell'] as const;

function CircularDial({ percent, label }: { percent: number; label: string }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  // Dynamic stroke color based on consensus label
  const colorMap: Record<string, string> = {
    'STRONG BUY': '142 76% 36%', // emerald-500
    BUY: '142 76% 36%',
    HOLD: '45 93% 47%', // amber-500
    SELL: '0 84% 60%', // red-500
    'STRONG SELL': '0 74% 42%', // red-700
  };
  const strokeHsl = colorMap[label?.toUpperCase?.() || 'HOLD'] || '45 93% 47%';

  return (
    <svg width="120" height="120" viewBox="0 0 120 120" className="flex-shrink-0">
      <circle cx="60" cy="60" r={radius} strokeWidth="10" className="stroke-muted/30 fill-none" />
      <circle
        cx="60" cy="60" r={radius} strokeWidth="10" fill="none"
        className={cn('transition-all duration-700 ease-out')}
        style={{
          stroke: `hsl(${strokeHsl})`,
          strokeDasharray: circumference,
          strokeDashoffset: offset,
          strokeLinecap: 'round',
        }}
      />
      <foreignObject x="25" y="35" width="70" height="50">
        <div className="h-full w-full flex flex-col items-center justify-center">
          <div className="text-xl font-semibold">{Math.round(percent)}%</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
        </div>
      </foreignObject>
    </svg>
  );
}

function RatingBar({ label, count, percent, variant }: { label: string; count: number; percent: number; variant: keyof typeof gradients }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums">{count}</span>
      </div>
      <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
        <div
          className={cn('h-full bg-gradient-to-r', gradients[variant])}
          style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
        />
      </div>
    </div>
  );
}

function RatingsCard({ data }: { data: RatingsConsensusItem | null }) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analyst Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            <Skeleton className="h-28 w-28 rounded-full" />
            <div className="flex-1 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totals = {
    strongBuy: data.strongBuy ?? data.strongbuy ?? 0,
    buy: data.buy ?? 0,
    hold: data.hold ?? 0,
    sell: data.sell ?? 0,
    strongSell: data.strongSell ?? data.strongsell ?? 0,
  };
  const totalCount = Object.values(totals).reduce((a, b) => a + (b || 0), 0) || data.total || 0;

  const dominantEntry = Object.entries(totals).sort((a, b) => (b[1] || 0) - (a[1] || 0))[0] as [keyof typeof totals, number];
  const dominantLabelMap: Record<keyof typeof totals, string> = {
    strongBuy: 'STRONG BUY',
    buy: 'BUY',
    hold: 'HOLD',
    sell: 'SELL',
    strongSell: 'STRONG SELL',
  };
  const dominantLabel = dominantLabelMap[dominantEntry?.[0] || 'hold'];
  const dominantPercent = totalCount ? (100 * (dominantEntry?.[1] || 0)) / totalCount : 0;

  const bars: Array<{ label: string; key: keyof typeof totals; variant: keyof typeof gradients }> = [
    { label: 'Strong Buy', key: 'strongBuy', variant: 'strongBuy' },
    { label: 'Buy', key: 'buy', variant: 'buy' },
    { label: 'Hold', key: 'hold', variant: 'hold' },
    { label: 'Sell', key: 'sell', variant: 'sell' },
    { label: 'Strong Sell', key: 'strongSell', variant: 'strongSell' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyst Ratings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <CircularDial percent={dominantPercent} label={dominantLabel} />
          <div className="flex-1 w-full space-y-3">
            {bars.map((b) => {
              const pct = totalCount ? ((totals[b.key] || 0) / totalCount) * 100 : 0;
              return (
                <RatingBar
                  key={b.label}
                  label={`${b.label}`}
                  count={totals[b.key] || 0}
                  percent={pct}
                  variant={b.variant}
                />
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PriceTargetCard({ data, currentPrice }: { data: PriceTargetConsensusItem | null; currentPrice: number | null }) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analyst Price Targets</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-28 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  // Extract values (median intentionally ignored)
  const low = Number(data.targetLow ?? data.low);
  const high = Number(data.targetHigh ?? data.high);
  const consensus = Number(data.targetConsensus ?? data.consensus);
  const current = typeof currentPrice === 'number' ? currentPrice : null;

  const isFiniteNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
  const pool = [low, high, consensus, current ?? NaN].filter(isFiniteNum);
  const min = pool.length ? Math.min(...pool) : 0;
  const max = pool.length ? Math.max(...pool) : 1;
  const range = Math.max(max - min, 1);
  const position = (v: number) => (isFiniteNum(v) ? `${((v - min) / range) * 100}%` : '0%');

  const points: Array<{ key: string; label: string; value: number; tone: string }> = [
    { key: 'L', label: 'Low', value: low, tone: 'text-[hsl(0,84%,60%)]' },
    { key: 'C', label: 'Consensus', value: consensus, tone: 'text-foreground' },
    { key: 'H', label: 'High', value: high, tone: 'text-[hsl(142,76%,36%)]' },
  ];

  const upsidePct = isFiniteNum(consensus) && current !== null && isFiniteNum(current)
    ? ((consensus - current) / current) * 100
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyst Price Targets</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Current price banner */}
        <div className="mb-5 rounded-xl border border-border/50 bg-gradient-to-r from-[hsl(var(--muted))] to-[hsl(var(--accent))] p-4 text-center">
          <div className="text-xs text-muted-foreground">Current Price</div>
          <div className="text-3xl font-semibold tabular-nums">{current !== null ? `$${current.toFixed(2)}` : '-'}</div>
        </div>

        {/* Scale slider */}
        <div className="relative pt-10 pb-12">
          <div className="relative h-2 rounded-full bg-gradient-to-r from-[hsl(0,84%,60%)] via-[hsl(45,93%,47%)] to-[hsl(142,76%,36%)]" />

          {points.map((p, idx) => (
            <div key={p.label} className="absolute" style={{ left: position(p.value) }}>
              <div className="w-5 h-5 rounded-full bg-background border-2 border-foreground translate-x-[-50%] translate-y-[-50%] flex items-center justify-center shadow-sm">
                <span className="text-[10px] font-semibold">{p.key}</span>
              </div>
              <div className={cn(
                'absolute whitespace-nowrap text-xs px-2 py-1 rounded-md bg-background/80 backdrop-blur-md border border-border/50 left-1/2 -translate-x-1/2',
                idx % 2 === 0 ? 'top-4' : 'bottom-4'
              )}>
                <span className="text-muted-foreground mr-1">{p.label}</span>
                <span className={cn('font-medium tabular-nums', p.tone)}>
                  {isFiniteNum(p.value) ? `$${p.value.toFixed(2)}` : '-'}
                </span>
              </div>
            </div>
          ))}

          {current !== null && isFiniteNum(current) && (
            <div className="absolute" style={{ left: position(current) }}>
              <div className="w-5 h-5 rounded-full bg-primary border-2 border-background translate-x-[-50%] translate-y-[-50%] shadow" />
            </div>
          )}
        </div>

        {/* Upside potential */}
        <div
          className={cn(
            'mt-6 rounded-xl p-4 text-center border',
            upsidePct === null
              ? 'bg-muted/30 text-muted-foreground border-border/50'
              : upsidePct >= 0
              ? 'bg-[hsl(142,76%,36%)]/10 text-[hsl(142,76%,36%)] border-transparent'
              : 'bg-[hsl(0,84%,60%)]/10 text-[hsl(0,84%,60%)] border-transparent'
          )}
        >
          <div className="text-sm">Consensus Upside Potential</div>
          <div className="text-2xl font-semibold tabular-nums">
            {upsidePct !== null ? `${upsidePct >= 0 ? '+' : ''}${upsidePct.toFixed(1)}%` : '-'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const Analyst: React.FC<AnalystProps> = ({ ticker }) => {
  const [ratings, setRatings] = useState<RatingsConsensusItem | null>(null);
  const [targets, setTargets] = useState<PriceTargetConsensusItem | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [ratingsRes, targetsRes, quote] = await Promise.all([
          fmpAPI.getRatingsConsensus(ticker),
          fmpAPI.getPriceTargetConsensus(ticker),
          fmpAPI.getQuote(ticker),
        ]);

        if (!mounted) return;
        setRatings(Array.isArray(ratingsRes) ? ratingsRes[0] : ratingsRes);
        setTargets(Array.isArray(targetsRes) ? targetsRes[0] : targetsRes);
        const price = Array.isArray(quote) ? quote[0]?.price : undefined;
        setCurrentPrice(typeof price === 'number' ? price : null);
      } catch (e) {
        console.error('Analyst metrics load error', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [ticker]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Analyst Ratings</CardTitle></CardHeader>
          <CardContent className="flex gap-6 items-center">
            <Skeleton className="h-28 w-28 rounded-full" />
            <div className="flex-1 space-y-3 w-full">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Analyst Price Targets</CardTitle></CardHeader>
          <CardContent>
            <Skeleton className="h-28 w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <RatingsCard data={ratings} />
      <PriceTargetCard data={targets} currentPrice={currentPrice} />
    </div>
  );
};

export default Analyst;
