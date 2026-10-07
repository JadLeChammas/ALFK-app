import { Fragment } from 'react';
import { View } from 'react-native';

import { Card } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { legalBlocks } from '@/data/legal';
import { useTheme } from '@/theme/ThemeProvider';

/** « **bold** » inside a line. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? (
          <Txt key={i} variant="bodyStrong">{p.slice(2, -2)}</Txt>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        )
      )}
    </>
  );
}

/** A legal text written by the admins (data/legal.ts format), as a readable page. */
export function LegalText({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <Card style={{ gap: 14 }}>
      {legalBlocks(text).map((b, i) => {
        if (b.kind === 'h2') return <Txt key={i} variant="h2" style={{ marginTop: i ? 12 : 0 }}>{b.text}</Txt>;
        if (b.kind === 'h3') return <Txt key={i} variant="h3" style={{ marginTop: 6 }}>{b.text}</Txt>;
        if (b.kind === 'p') return <Txt key={i} color="textMuted"><Inline text={b.text} /></Txt>;
        if (b.kind === 'list')
          return (
            <View key={i} style={{ gap: 6 }}>
              {b.items.map((it, k) => (
                <View key={k} style={{ flexDirection: 'row', gap: 8 }}>
                  <Txt color="textMuted">•</Txt>
                  <Txt color="textMuted" style={{ flex: 1 }}><Inline text={it} /></Txt>
                </View>
              ))}
            </View>
          );
        return (
          <View key={i} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: 'hidden' }}>
            {b.rows.map((row, r) => (
              <View key={r} style={{ flexDirection: 'row', backgroundColor: r === 0 ? colors.surfaceAlt : undefined, borderTopWidth: r ? 1 : 0, borderTopColor: colors.border }}>
                {row.map((cell, c) => (
                  <Txt key={c} variant={r === 0 ? 'smallStrong' : 'small'} color={r === 0 ? 'text' : 'textMuted'} style={{ flex: 1, padding: 10, borderLeftWidth: c ? 1 : 0, borderLeftColor: colors.border }}>
                    <Inline text={cell} />
                  </Txt>
                ))}
              </View>
            ))}
          </View>
        );
      })}
    </Card>
  );
}
