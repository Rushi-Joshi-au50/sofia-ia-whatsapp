
interface StoredMessage {
  from: string;
  body: string;
  timestamp: number;
}

export const messageStore: StoredMessage[] = [];

export function addMessage(from: string, body: string) {
  messageStore.push({
    from,
    body, 
    timestamp: Date.now()
  });
}
