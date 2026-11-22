# Структура на таблиците (Supabase / PostgreSQL)

Източник: [`database/schema.sql`](../database/schema.sql). Диаграма: [ER_DIAGRAM.md](ER_DIAGRAM.md).
Снимки от Supabase Dashboard: `docs/screens/etap2/supabase/` ☐ *(правят се след създаване на проекта — вж. SUPABASE_SETUP.md)*

## Логически свързаните таблици (минимумът са 3; имаме 6)
Основната верига на данните: **categories → transactions** и **categories → budgets**, **savings_goals → goal_contributions**.

### categories
| Колона | Тип | Ограничение |
|---|---|---|
| id | uuid | **PK**, default gen_random_uuid() |
| user_id | uuid | FK → auth.users, default auth.uid() |
| key | text | — |
| kind | text | CHECK in ('expense','income') |
| name_bg, name_en | text | NOT NULL |
| icon, color, keywords | text | — |

### transactions
| Колона | Тип | Ограничение |
|---|---|---|
| id | uuid | **PK** |
| user_id | uuid | FK → auth.users |
| category_id | uuid | **FK → categories.id** (ON DELETE SET NULL) |
| type | text | CHECK in ('expense','income') |
| amount | numeric(12,2) | CHECK amount > 0 |
| note | text | default '' |
| tx_date | date | NOT NULL |

### budgets
| Колона | Тип | Ограничение |
|---|---|---|
| id | uuid | **PK** |
| user_id | uuid | FK → auth.users |
| category_id | uuid | **FK → categories.id** (ON DELETE CASCADE) |
| limit_amount | numeric(12,2) | CHECK > 0; UNIQUE(user_id, category_id) |

### savings_goals и goal_contributions
`savings_goals(id PK, user_id, name, icon, target_amount, saved_amount, deadline, priority)` и `goal_contributions(id PK, user_id, goal_id FK → savings_goals.id ON DELETE CASCADE, amount, contributed_at)`.

### profiles
`profiles(id PK = auth.users.id, display_name, role, locale, currency)` — създава се автоматично при регистрация (тригер `on_auth_user_created`).

## Защита (RLS)
На всички таблици е включен Row Level Security с политика `own rows`: потребителят чете и променя само редове, където `user_id = auth.uid()` (за `profiles`: `id = auth.uid()`). Няма публичен достъп до лични данни.

## Какво се променя спрямо ER диаграмата от Етап 1
Нищо в структурата — диаграмата от Етап 1 вече беше приведена към тази схема (виж промените в PROJECT_PLAN §0).
