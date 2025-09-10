// Константы тем для постов логбука
export const LOGBOOK_TOPICS = [
  { value: 'tuning', label: 'Tuning', icon: '🔧', color: 'bg-blue-500' },
  { value: 'repair', label: 'Reparatur', icon: '🔨', color: 'bg-red-500' },
  { value: 'maintenance', label: 'Wartung', icon: '⚙️', color: 'bg-green-500' },
  { value: 'travel', label: 'Reisen', icon: '🗺️', color: 'bg-purple-500' },
  { value: 'meetup', label: 'Treffen', icon: '👥', color: 'bg-orange-500' },
  { value: 'show', label: 'Ausstellungen', icon: '🏆', color: 'bg-yellow-500' },
  { value: 'racing', label: 'Rennen', icon: '🏁', color: 'bg-pink-500' },
  { value: 'purchase', label: 'Kauf', icon: '💰', color: 'bg-indigo-500' },
  { value: 'sale', label: 'Verkauf', icon: '💸', color: 'bg-gray-500' },
  { value: 'review', label: 'Testbericht', icon: '📝', color: 'bg-teal-500' },
  { value: 'other', label: 'Sonstiges', icon: '📌', color: 'bg-slate-500' }
] as const;

export type LogbookTopic = typeof LOGBOOK_TOPICS[number]['value'];

export function getTopicByValue(value: string) {
  return LOGBOOK_TOPICS.find(topic => topic.value === value);
}

export function getTopicLabel(value: string): string {
  const topic = getTopicByValue(value);
  return topic?.label || 'Unbekannt';
}

export function getTopicIcon(value: string): string {
  const topic = getTopicByValue(value);
  return topic?.icon || '📌';
}

export function getTopicColor(value: string): string {
  const topic = getTopicByValue(value);
  return topic?.color || 'bg-slate-500';
}
