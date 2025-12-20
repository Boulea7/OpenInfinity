/**
 * AboutSection - Version and app information
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, Github, Heart } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';

// Get version from manifest
const getVersion = (): string => {
  try {
    return chrome.runtime.getManifest().version;
  } catch {
    return '1.0.0';
  }
};

export const AboutSection: React.FC = () => {
  const { t } = useTranslation();
  const version = getVersion();

  const links = [
    {
      icon: <Github className="w-4 h-4" />,
      label: 'GitHub',
      url: 'https://github.com/Boulea7/OpenInfinity',
    },
    {
      icon: <Heart className="w-4 h-4" />,
      label: t('settings.about.donate', '支持作者'),
      url: 'https://github.com/Boulea7/OpenInfinity',
    },
  ];

  return (
    <CollapsibleSection
      id="about"
      title={t('settings.about.title', '关于')}
    >
      {/* Version info */}
      <div className="text-center py-4">
        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          Open Infinity
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {t('settings.about.version', '版本')} {version}
        </div>
      </div>

      {/* Links */}
      <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-2">
        {links.map(({ icon, label, url }) => (
          <a
            key={label}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="
              flex items-center justify-between
              px-3 py-2 rounded
              text-sm text-gray-700 dark:text-gray-300
              bg-gray-50 dark:bg-gray-800/50
              hover:bg-gray-100 dark:hover:bg-gray-800
              transition-colors
            "
          >
            <div className="flex items-center gap-2">
              {icon}
              <span>{label}</span>
            </div>
            <ExternalLink className="w-3 h-3 opacity-50" />
          </a>
        ))}
      </div>

      {/* Copyright */}
      <div className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        © {new Date().getFullYear()} Open Infinity. {t('settings.about.rights', 'All rights reserved.')}
      </div>
    </CollapsibleSection>
  );
};

export default AboutSection;
