export type NegotiationMode = 'default' | 'disabled' | 'range';

export type NegotiationRule = {
  negotiation_mode?: NegotiationMode;
  negotiation_min_price?: number;
  negotiation_max_price?: number;
};

export function resolveNegotiationRule(item: NegotiationRule, tenantDefault?: NegotiationRule): NegotiationRule {
  const mode = (item.negotiation_mode ?? 'default') as NegotiationMode;

  if (mode === 'default') {
    return {
      negotiation_mode: (tenantDefault?.negotiation_mode ?? 'disabled') as NegotiationMode,
      negotiation_min_price: tenantDefault?.negotiation_min_price,
      negotiation_max_price: tenantDefault?.negotiation_max_price,
    };
  }

  return {
    negotiation_mode: mode,
    negotiation_min_price: item.negotiation_min_price,
    negotiation_max_price: item.negotiation_max_price,
  };
}

export function formatNegotiationRule(item: NegotiationRule, tenantDefault?: NegotiationRule) {
  const mode = (item.negotiation_mode ?? 'default') as NegotiationMode;

  if (mode === 'default') {
    const resolved = resolveNegotiationRule(item, tenantDefault);
    if (resolved.negotiation_mode === 'range') {
      const min = resolved.negotiation_min_price;
      const max = resolved.negotiation_max_price;
      if (typeof min === 'number' && typeof max === 'number') {
        return `Negotiation: Default (Range ${min}–${max})`;
      }
      return 'Negotiation: Default (Range)';
    }
    return `Negotiation: Default (No negotiation)`;
  }

  if (mode === 'disabled') return 'Negotiation: No negotiation';

  const min = item.negotiation_min_price;
  const max = item.negotiation_max_price;
  if (typeof min === 'number' && typeof max === 'number') {
    return `Negotiation: Range ${min}–${max}`;
  }
  return 'Negotiation: Range';
}

export function formatNegotiationBrief(item: NegotiationRule, tenantDefault?: NegotiationRule) {
  const mode = (item.negotiation_mode ?? 'default') as NegotiationMode;

  const resolved = mode === 'default' ? resolveNegotiationRule(item, tenantDefault) : item;
  const resolvedMode = (resolved.negotiation_mode ?? 'disabled') as NegotiationMode;

  if (resolvedMode === 'disabled') return 'No negotiation';

  const min = resolved.negotiation_min_price;
  const max = resolved.negotiation_max_price;
  if (typeof min === 'number' && typeof max === 'number') {
    return `Negotiable ₦${min.toLocaleString()}–₦${max.toLocaleString()}`;
  }
  return 'Negotiable range';
}
