import { Text, type TextProps } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { type as typeScale, type ColorToken, type TypeVariant } from '@/theme/tokens';

type Props = TextProps & {
  variant?: TypeVariant;
  color?: ColorToken;
  align?: 'left' | 'center' | 'right';
};

export function Txt({ variant = 'body', color = 'text', align, style, ...rest }: Props) {
  const { colors } = useTheme();
  const defaultColor = variant === 'caption' ? colors.textSubtle : colors[color];
  return (
    <Text
      {...rest}
      style={[typeScale[variant], { color: color === 'text' ? defaultColor : colors[color] }, align && { textAlign: align }, style]}
    />
  );
}
