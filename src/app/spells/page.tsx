import Spellbook from '@/components/Spellbook';

export default function SpellsPage() {
    return (
        <div className="flex-1 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
            <Spellbook />
        </div>
    );
}
