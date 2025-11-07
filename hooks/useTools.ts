import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TOOL_DEFINITIONS } from '../constants';
import { Tool } from '../types';

export const useTools = (): Tool[] => {
  const { t } = useTranslation('tools');
  
  return useMemo(() => 
    TOOL_DEFINITIONS.map(def => ({
      id: def.id,
      title: t(def.titleKey),
      description: t(def.descriptionKey),
      gifSrc: def.gifSrc,
      tintClass: def.tintClass,
      shadowClass: def.shadowClass,
    })),
    [t]
  );
};