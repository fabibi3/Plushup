// Bilan hebdo : le récapitulatif qu'on a envie de partager (rétention + bouche-à-oreille).
import { useMemo } from 'react';
import { View } from 'react-native';

import { Txt } from '@/components/Txt';
import { WaveBand } from '@/components/Wave';
import { Button, Card, Header, Screen } from '@/components/ui';
import { fmt, num, useT } from '@/i18n';
import { referralUrl } from '@/lib/constants';
import { formatLongDate } from '@/lib/dates';
import { shareOnWhatsApp } from '@/lib/share';
import { useToday } from '@/lib/useToday';
import { weeklySummary } from '@/lib/weekly';
import { useApp } from '@/store/useApp';
import { colors, radius, space } from '@/theme/tokens';

export default function Bilan() {
  const t = useT();
  const today = useToday();
  const logs = useApp((s) => s.logs);
  const completions = useApp((s) => s.completions);
  const referralCode = useApp((s) => s.referralCode);
  const w = useMemo(() => weeklySummary(logs, completions, today), [logs, completions, today]);
  const short = (key: string) => formatLongDate(key, t.days.long, t.months);

  const encourage = w.activeDays >= 6 ? t.weekly.encourageHigh : w.activeDays >= 3 ? t.weekly.encourageMid : t.weekly.encourageLow;
  const share = () =>
    void shareOnWhatsApp(`${fmt(t.weekly.shareText, { days: w.activeDays, routines: w.routines })} ${referralUrl(referralCode || 'APP')}`);

  return (
    <Screen footer={<Button label={t.weekly.share} icon="whatsapp" onPress={share} />}>
      <Header title={t.weekly.title} />

      <Card tone="deep" style={{ paddingBottom: 0, overflow: 'hidden' }}>
        <Txt variant="caption" color={colors.mint}>
          {fmt(t.weekly.period, { from: short(w.from), to: short(w.to) })}
        </Txt>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <BigStat value={`${w.activeDays}/7`} label={t.weekly.activeDays} />
          <BigStat value={String(w.routines)} label={t.weekly.routines} />
          <BigStat value={w.avgWater == null ? '–' : num(w.avgWater)} label={t.weekly.water} />
        </View>
        <Txt color={colors.white} weight="semibold">
          {encourage}
        </Txt>
        <WaveBand color={colors.teal} height={26} style={{ marginHorizontal: -space.lg }} />
      </Card>

      <Card style={{ marginTop: space.lg }}>
        <Txt variant="h2">{t.weekly.heaviness}</Txt>
        <Txt variant="hero">{w.avgHeaviness == null ? '–' : `${num(w.avgHeaviness)}/4`}</Txt>
        {w.prevAvgHeaviness != null && w.avgHeaviness != null ? (
          <Txt color={colors.muted}>{fmt(t.weekly.vsPrev, { b: w.prevAvgHeaviness })}</Txt>
        ) : null}
        {w.lightestDay ? (
          <View style={{ backgroundColor: colors.mintSoft, borderRadius: radius.md, padding: space.md }}>
            <Txt variant="small">{fmt(t.weekly.lightest, { day: short(w.lightestDay) })}</Txt>
          </View>
        ) : null}
        <Txt variant="small" color={colors.muted}>
          {t.progress.insightNote}
        </Txt>
      </Card>
    </Screen>
  );
}

function BigStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.teal, borderRadius: radius.md, padding: space.md, gap: 2 }}>
      <Txt variant="title" color={colors.white}>
        {value}
      </Txt>
      <Txt variant="caption" color={colors.mint}>
        {label}
      </Txt>
    </View>
  );
}
