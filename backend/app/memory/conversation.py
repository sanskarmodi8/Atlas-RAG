"""Short-term conversation memory."""

from collections import defaultdict, deque
from typing import Deque, Dict, List, Tuple

# Each message: (role, content)
Message = Tuple[str, str]

_MAX_TURNS = 4


class ConversationMemory:
    """In-memory short-term conversation history."""

    def __init__(self, max_turns: int = _MAX_TURNS) -> None:
        """Initialize conversation memory store."""
        self.max_turns = max_turns
        self._store: Dict[str, Deque[Message]] = defaultdict(
            lambda: deque(maxlen=max_turns * 2),
        )

    def add_user_message(self, session_id: str, content: str) -> None:
        """Add a user message to memory."""
        self._store[session_id].append(("user", content))

    def add_assistant_message(self, session_id: str, content: str) -> None:
        """Add an assistant message to memory."""
        self._store[session_id].append(("assistant", content))

    def get_history(self, session_id: str) -> List[Message]:
        """Return conversation history for a session."""
        return list(self._store.get(session_id, []))

    def clear(self, session_id: str) -> None:
        """Clear conversation history for a session."""
        self._store.pop(session_id, None)


# Global singleton instance
conversation_memory = ConversationMemory()
