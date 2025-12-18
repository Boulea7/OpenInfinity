import { AccountSection } from './AccountSection';
import { BackupSection } from './BackupSection';
import { FeedbackSection } from './FeedbackSection';
import { DonateSection } from './DonateSection';
import { FollowUsSection } from './FollowUsSection';
import { SupportSection } from './SupportSection';
import { AboutSection } from './AboutSection';

/**
 * MyTab Component
 * "My" section of the navigation panel
 * Displays user account, backup, sync, support, and about information
 */
export function MyTab() {
    return (
        <div className="flex flex-col gap-4 animate-fade-in pb-4">
            <AccountSection />

            <BackupSection />

            <FeedbackSection />

            <DonateSection />

            <FollowUsSection />

            <SupportSection />

            <AboutSection />

            {/* Bottom spacer for comfortable scrolling */}
            <div className="h-4" />
        </div>
    );
}
