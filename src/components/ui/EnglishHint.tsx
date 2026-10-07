import { Feather } from '@expo/vector-icons';

import { Row } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Above the « · English » fields of the admin forms: the English version is read in every language
 * but French; left empty, the French text is shown.
 */
export function EnglishHint() {
  const { d } = useI18n();
  const { colors } = useTheme();
  return (
    <Row gap={8} style={{ alignItems: 'flex-start', marginTop: 4 }}>
      <Feather name="globe" size={14} color={colors.textSubtle} style={{ marginTop: 2 }} />
      <Txt variant="small" color="textSubtle" style={{ flex: 1 }}>{d.common.englishHint}</Txt>
    </Row>
  );
}
