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
        <div className="flex flex-col gap-3 animate-fade-in p-3">
            <AccountSection />

            <BackupSection />

            <FeedbackSection />

            <DonateSection />

            <FollowUsSection />

            <SupportSection />

            <AboutSection />
        </div>
    );
}
