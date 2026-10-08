import { useLocalSearchParams } from 'expo-router';

import { MessagesLayout } from '@/components/messaging';

export default function MhConversation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MessagesLayout conversationId={id} scope="mh" />;
}
