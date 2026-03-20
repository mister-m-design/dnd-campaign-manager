import HomebrewManager from '@/components/HomebrewManager';

export const metadata = {
  title: 'Homebrew Workshop | MythicTable',
  description: 'Create and manage custom homebrew content for your D&D campaign',
};

export default function HomebrewPage() {
  return <HomebrewManager />;
}
