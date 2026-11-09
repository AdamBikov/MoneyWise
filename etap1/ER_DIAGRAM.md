# ER диаграма (начална и текуща)

![ER диаграма](screens/er_diagram.png)

```mermaid
erDiagram
  AUTH_USERS ||--|| PROFILES : "има профил"
  AUTH_USERS ||--o{ CATEGORIES : "притежава"
  AUTH_USERS ||--o{ TRANSACTIONS : "притежава"
  AUTH_USERS ||--o{ BUDGETS : "притежава"
  AUTH_USERS ||--o{ SAVINGS_GOALS : "притежава"
  CATEGORIES ||--o{ TRANSACTIONS : "класифицира"
  CATEGORIES ||--o| BUDGETS : "има лимит"
  SAVINGS_GOALS ||--o{ GOAL_CONTRIBUTIONS : "получава"

  PROFILES {
    uuid id PK
    text display_name
    text role
    text locale
    text currency
  }
  CATEGORIES {
    uuid id PK
    uuid user_id FK
    text key
    text kind
    text name_bg
    text name_en
    text icon
    text color
    text keywords
  }
  TRANSACTIONS {
    uuid id PK
    uuid user_id FK
    uuid category_id FK
    text type
    numeric amount
    text note
    date tx_date
  }
  BUDGETS {
    uuid id PK
    uuid user_id FK
    uuid category_id FK
    numeric limit_amount
  }
  SAVINGS_GOALS {
    uuid id PK
    uuid user_id FK
    text name
    numeric target_amount
    numeric saved_amount
    date deadline
    smallint priority
  }
  GOAL_CONTRIBUTIONS {
    uuid id PK
    uuid user_id FK
    uuid goal_id FK
    numeric amount
    date contributed_at
  }
```

## Описание на таблиците
| Таблица | Първичен ключ | Външни ключове | Ограничения |
|---|---|---|---|
| profiles | id (uuid) | id → auth.users | role и locale със CHECK, валута само EUR |
| categories | id | user_id → auth.users | kind IN (expense, income) |
| transactions | id | user_id → auth.users, category_id → categories (SET NULL) | amount > 0, type IN (...) |
| budgets | id | user_id, category_id → categories (CASCADE) | limit_amount > 0, UNIQUE(user_id, category_id) |
| savings_goals | id | user_id → auth.users | target_amount > 0, saved_amount ≥ 0, priority 1..3 |
| goal_contributions | id | user_id, goal_id → savings_goals (CASCADE) | amount > 0 |

**RLS:** на всички таблици политика „own rows“ — потребителят вижда и променя само редове със `user_id = auth.uid()` (за profiles: `id = auth.uid()`).
Реализация: [database/schema.sql](../database/schema.sql).
