# ER диаграма (начална и текуща)

```mermaid
erDiagram
  AUTH_USERS ||--|| PROFILES : "has one"
  AUTH_USERS ||--o{ CATEGORIES : owns
  AUTH_USERS ||--o{ TRANSACTIONS : owns
  AUTH_USERS ||--o{ BUDGETS : owns
  AUTH_USERS ||--o{ SAVINGS_GOALS : owns
  CATEGORIES ||--o{ TRANSACTIONS : classifies
  CATEGORIES ||--o| BUDGETS : "limited by"
  SAVINGS_GOALS ||--o{ GOAL_CONTRIBUTIONS : receives

  PROFILES { uuid id PK "= auth.users.id"; text display_name; text role "student|teacher|admin"; text locale "bg|en"; text currency "EUR" }
  CATEGORIES { uuid id PK; uuid user_id FK; text key; text kind "expense|income"; text name_bg; text name_en; text icon; text color; text keywords }
  TRANSACTIONS { uuid id PK; uuid user_id FK; uuid category_id FK; text type; numeric amount "CHECK > 0"; text note; date tx_date }
  BUDGETS { uuid id PK; uuid user_id FK; uuid category_id FK "UNIQUE(user,cat)"; numeric limit_amount "CHECK > 0" }
  SAVINGS_GOALS { uuid id PK; uuid user_id FK; text name; numeric target_amount; numeric saved_amount; date deadline; smallint priority "1..3" }
  GOAL_CONTRIBUTIONS { uuid id PK; uuid user_id FK; uuid goal_id FK; numeric amount; date contributed_at }
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
