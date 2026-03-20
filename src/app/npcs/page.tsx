import NPCManager from '@/components/NPCManager';

export default function BestiaryPage() {
    return (
        <div className="flex-1 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
            <NPCManager />
        </div>
    );
}
