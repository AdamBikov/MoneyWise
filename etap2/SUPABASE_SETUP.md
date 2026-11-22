# SUPABASE_SETUP — как се създава базата данни (стъпка по стъпка)

> **Състояние:** проектът `MoneyWise` вече е създаден и `schema.sql` е приложена (с поправка за права — вж. GRANT в края на файла), а `src/js/config.js` съдържа адреса и publishable ключа. Остава **само раздел 4–6** (регистрация, данни, снимки). Разделите 1–3 са за нов проект.

Тези стъпки правите **вие** (Реджеб води) в своя Supabase акаунт — кодът и SQL файловете са готови. Отнема около 10–15 минути.

## 1. Нов проект
1. https://supabase.com → **Dashboard → New project**.
2. Име: `moneywise`. Регион: най-близкия (напр. Frankfurt). **Парола на базата** — запазете я в мениджър на пароли, **не в GitHub**.
3. Изчакайте проектът да се създаде (1–2 минути).

## 2. Таблиците
1. **SQL Editor → New query**.
2. Копирайте цялото съдържание на [`database/schema.sql`](../database/schema.sql) и натиснете **Run**. Очаквате „Success“.
3. **Table Editor** — трябва да виждате: `profiles`, `categories`, `transactions`, `budgets`, `savings_goals`, `goal_contributions` (6 таблици, не са нужни само 3).
4. **Authentication → Policies** — за всяка таблица има политика `own rows` (RLS е включен). Не го изключвайте.

## 3. Ключове за приложението
1. **Project Settings → API Keys** (или Connect). Копирайте **Project URL** и **Publishable key** (старото име е `anon` key).
2. Отворете `src/js/config.js` и ги поставете:
   ```js
   window.MW_CONFIG = { SUPABASE_URL: "https://XXXX.supabase.co", SUPABASE_ANON_KEY: "sb_publishable_..." };
   ```
3. **Никога** не слагайте `service_role` / secret ключ. Publishable ключът е безопасен само защото RLS е включен.
4. **Authentication → Providers → Email**: за по-лесно тестване можете временно да изключите „Confirm email“; иначе потребителят трябва да потвърди имейла си.

## 4. Тестови потребител и данни
1. Отворете приложението (`cd src` → `python -m http.server 5173` → http://localhost:5173). Ще видите екран за вход.
2. **Регистрация** с тестов имейл (не личен) → вход.
3. **Настройки → Зареди демо данни** — записва в Supabase примерни транзакции, бюджети и цели (измислени, в евро).
   - Алтернатива: от Authentication → Users копирайте UUID и в SQL Editor изпълнете `select public.seed_demo_data('UUID');` (след като сте изпълнили [`database/seed.sql`](../database/seed.sql)).

## 5. Какво да снимате за предаването (без ключове!)
Запишете в `docs/screens/etap2/supabase/`:
- `tables.png` — Table Editor със списъка на таблиците.
- `transactions_structure.png`, `categories_structure.png`, `savings_goals_structure.png` — структура на колоните (Table Editor → таблица → Definition / иконата за колони).
- `transactions_rows.png` — няколко реда тестови данни.
- `relations.png` — **Database → Schema Visualizer** (показва връзките).
- `rls.png` — Authentication → Policies.
Преди да снимате: скрийте/не показвайте API ключове и паролата на базата.

## 6. Проверка, че връзката работи
1. Влезте → **Транзакции → Нова транзакция** → запишете разход.
2. В Supabase **Table Editor → transactions** новият ред трябва да се вижда (колона `user_id` = вашият).
3. Влезте с втори тестов акаунт — не трябва да виждате чуждите редове (проверка на RLS).

## Ако нещо не работи
| Проблем | Какво да проверите |
|---|---|
| „permission denied“ / празни данни | изпълнен ли е целият `schema.sql` (включително блокът GRANT); влезли ли сте |
| Екран за вход не се показва | `config.js` — празни ли са URL/ключ (тогава е демо режим) |
| „Email not confirmed“ | потвърдете имейла или изключете Confirm email |
| Грешка при `schema.sql` | изпълнете целия файл наведнъж, в нов проект |
