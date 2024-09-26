CREATE TABLE IF NOT EXISTS members (
    userId UInt64,
    chatId Int64,
    username Nullable(String),
    firstName Nullable(String),
    lastName Nullable(String),
    action Enum8(
        'message' = 1,
        'edited_message' = 2,
        'new_chat_members' = 3,
        'left_chat_member' = 4,
        'chat_member' = 5,
        'message_reaction' = 6
    ),
    timestamp DateTime,
    custom Nullable(String),
    languageCode Nullable(String),
    isPremium Nullable(Bool),
    isBot Nullable(Bool),
) ENGINE = MergeTree()
ORDER BY (userId, timestamp);