import { AccountSection } from './AccountSection';
import { BackupSection } from './BackupSection';
import { CloudSyncSection } from './CloudSyncSection';
import { SupportSection } from './SupportSection';
import { AboutSection } from './AboutSection';

/**
 * MyTab Component
 * "My" section of the navigation panel
 * Displays user account, backup, sync, support, and about information
 */
export function MyTab() {
    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-4">
            <AccountSection />

            <BackupSection />

            <CloudSyncSection />

            <SupportSection />

            <AboutSection />

            {/* Bottom spacer for comfortable scrolling */}
            <div className="h-4" />
        </div>
    );
}
