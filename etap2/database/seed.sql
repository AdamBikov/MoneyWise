-- MoneyWise — примерни (тестови) данни за Supabase
-- Изпълнява се в SQL Editor СЛЕД schema.sql и СЛЕД като вече има регистриран потребител.
-- Данните са измислени, без лична финансова информация. Всички суми са в евро.
--
-- Употреба:
--   1) Supabase → Authentication → Users → копирайте UUID на тестовия потребител.
--   2) Изпълнете:  select public.seed_demo_data('ВАШИЯТ-UUID-ТУК');
--   Повторно изпълнение първо изтрива старите тестови транзакции, бюджети и цели на този потребител.

create or replace function public.seed_demo_data(uid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  c_food uuid; c_eat uuid; c_transport uuid; c_housing uuid; c_fun uuid; c_salary uuid; c_free uuid;
  m date := date_trunc('month', current_date)::date;   -- първо число на текущия месец
  g1 uuid; g2 uuid;
begin
  -- изчистване на предишни тестови данни на този потребител
  delete from goal_contributions where user_id = uid;
  delete from savings_goals      where user_id = uid;
  delete from budgets            where user_id = uid;
  delete from transactions       where user_id = uid;

  -- категории (само ако потребителят още няма)
  if not exists (select 1 from categories where user_id = uid) then
    insert into categories (user_id, key, kind, name_bg, name_en, icon, color) values
      (uid, 'food',      'expense', 'Храна',            'Groceries',      'cart',      '#2dd4a8'),
      (uid, 'eatout',    'expense', 'Заведения',        'Eating out',     'utensils',  '#ff8a3d'),
      (uid, 'transport', 'expense', 'Транспорт',        'Transport',      'bus',       '#4ea1ff'),
      (uid, 'housing',   'expense', 'Жилище и сметки',  'Housing & bills','home',      '#5b6cff'),
      (uid, 'fun',       'expense', 'Забавления',       'Entertainment',  'play',      '#ff6b81'),
      (uid, 'salary',    'income',  'Заплата',          'Salary',         'briefcase', '#2dd4a8'),
      (uid, 'freelance', 'income',  'Фрийланс',         'Freelance',      'laptop',    '#6be3ff');
  end if;

  select id into c_food      from categories where user_id = uid and key = 'food';
  select id into c_eat       from categories where user_id = uid and key = 'eatout';
  select id into c_transport from categories where user_id = uid and key = 'transport';
  select id into c_housing   from categories where user_id = uid and key = 'housing';
  select id into c_fun       from categories where user_id = uid and key = 'fun';
  select id into c_salary    from categories where user_id = uid and key = 'salary';
  select id into c_free      from categories where user_id = uid and key = 'freelance';

  -- транзакции: предходния и текущия месец
  insert into transactions (user_id, category_id, type, amount, note, tx_date) values
    (uid, c_salary,    'income',  1200.00, 'Заплата',          (m - interval '1 month')::date),
    (uid, c_free,      'income',   220.00, 'Уебсайт за клиент',(m - interval '1 month' + interval '11 days')::date),
    (uid, c_housing,   'expense',  450.00, 'Наем',             (m - interval '1 month' + interval '2 days')::date),
    (uid, c_food,      'expense',   42.30, 'Lidl',             (m - interval '1 month' + interval '4 days')::date),
    (uid, c_food,      'expense',   55.10, 'Billa',            (m - interval '1 month' + interval '10 days')::date),
    (uid, c_eat,       'expense',   18.50, 'Пица',             (m - interval '1 month' + interval '12 days')::date),
    (uid, c_transport, 'expense',   28.00, 'Карта за градски транспорт', (m - interval '1 month' + interval '1 days')::date),
    (uid, c_fun,       'expense',    9.99, 'Netflix',          (m - interval '1 month' + interval '9 days')::date),
    (uid, c_salary,    'income',  1200.00, 'Заплата',          m),
    (uid, c_housing,   'expense',  450.00, 'Наем',             m + 2),
    (uid, c_food,      'expense',   38.75, 'Kaufland',         m + 3),
    (uid, c_eat,       'expense',    6.20, 'Кафе',             m + 4),
    (uid, c_transport, 'expense',   28.00, 'Карта за градски транспорт', m + 1);

  -- бюджети (месечни лимити)
  insert into budgets (user_id, category_id, limit_amount) values
    (uid, c_food, 300), (uid, c_eat, 100), (uid, c_transport, 60), (uid, c_fun, 50);

  -- спестовни цели и вноски
  insert into savings_goals (user_id, name, icon, target_amount, saved_amount, deadline, priority)
    values (uid, 'Екскурзия', 'plane', 600, 200, (current_date + interval '5 months')::date, 2) returning id into g1;
  insert into savings_goals (user_id, name, icon, target_amount, saved_amount, deadline, priority)
    values (uid, 'Нов телефон', 'phone', 800, 150, (current_date + interval '8 months')::date, 3) returning id into g2;
  insert into goal_contributions (user_id, goal_id, amount, contributed_at) values
    (uid, g1, 120, (current_date - interval '40 days')::date),
    (uid, g1,  80, (current_date - interval '10 days')::date),
    (uid, g2, 150, (current_date - interval '20 days')::date);
end $$;

-- Проверка след изпълнение (заменете UUID):
-- select to_char(tx_date,'YYYY-MM') as month, type, sum(amount) from transactions where user_id = 'UUID' group by 1,2 order by 1;
