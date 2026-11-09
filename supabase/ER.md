# ER диаграма / ER diagram

```mermaid
erDiagram
  AUTH_USERS ||--o{ CATEGORIES : owns
  AUTH_USERS ||--o{ TRANSACTIONS : owns
  AUTH_USERS ||--o{ BUDGETS : owns
  AUTH_USERS ||--o{ GOALS : owns
  CATEGORIES ||--o{ TRANSACTIONS : classifies
  CATEGORIES ||--o| BUDGETS : "limited by"
  GOALS ||--o{ GOAL_CONTRIBUTIONS : receives

  CATEGORIES { uuid id PK; uuid user_id FK; text key; text kind; text name_bg; text name_en; text icon; text color; text keywords }
  TRANSACTIONS { uuid id PK; uuid user_id FK; uuid category_id FK; text type; numeric amount; text note; date tx_date }
  BUDGETS { uuid id PK; uuid user_id FK; uuid category_id FK; numeric limit_amount }
  GOALS { uuid id PK; uuid user_id FK; text name; numeric target_amount; numeric saved_amount; date deadline; smallint priority }
  GOAL_CONTRIBUTIONS { uuid id PK; uuid user_id FK; uuid goal_id FK; numeric amount; date contributed_at }
```
