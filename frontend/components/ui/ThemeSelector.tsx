// frontend/components/ui/ThemeSelector.tsx
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export interface ThemeSelectorProps {
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showCategories?: boolean;
  showAccessibility?: boolean;
}

export function ThemeSelector(_props: ThemeSelectorProps) {
  const { colorMode, changeColorMode } = useTheme();
  const { showLabel = true, size = 'md' } = _props;
  const isDark = colorMode === 'dark';

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 20 : 18;
  const padding = size === 'sm' ? 'px-2 py-1' : size === 'lg' ? 'px-3 py-2' : 'px-2.5 py-1.5';
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs';

  return (
    <button
      type="button"
      onClick={() => changeColorMode(isDark ? 'light' : 'dark')}
      className={`inline-flex items-center gap-2 rounded border border-soft bg-surface hover:bg-elevated ${padding}`}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      title={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
    >
      {isDark ? (
        <Sun size={iconSize} className="text-accent" />
      ) : (
        <Moon size={iconSize} className="text-accent" />
      )}
      {showLabel && (
        <span className={`${textSize} text-muted`}>
          {isDark ? 'Claro' : 'Escuro'}
        </span>
      )}
    </button>
  );
}

export default ThemeSelector;
