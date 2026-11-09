# Създава 15-те Issues от docs/ISSUES.md в GitHub хранилището.
# Нужно: инсталиран GitHub CLI (gh) и `gh auth login`; хранилището да съществува в GitHub и да е качено (git push).
# Употреба:  .\scripts\create-issues.ps1 -Repo "AdamBikov/MoneyWise" -User1 "github-на-Адам" -User2 "github-на-Реджеб"
param(
  [string]$Repo = "AdamBikov/MoneyWise",
  [string]$User1 = "AdamBikov",   # Адам Биков — интерфейс
  [string]$User2 = ""             # Реджеб Туджар — данни и алгоритъм (GitHub потребителско име)
)

$issues = @(
  @{ t="Проучване на 3 сходни приложения (RESEARCH.md)"; a="both"; s=1 },
  @{ t="Потребителски истории и PRODUCT_SPEC.md"; a="u1"; s=1 },
  @{ t="Макети на два екрана (Табло, Бюджети)"; a="u1"; s=1 },
  @{ t="ER диаграма и проектиране на таблиците"; a="u2"; s=1 },
  @{ t="Supabase проект + schema.sql + RLS политики"; a="u2"; s=2 },
  @{ t="Навигация и адаптивен изглед (мобилно меню)"; a="u1"; s=2 },
  @{ t="Двуезичност BG/EN (i18n обект)"; a="u1"; s=2 },
  @{ t="CRUD за транзакции с валидация"; a="u2"; s=3 },
  @{ t="Форми за приход/разход (UI)"; a="u1"; s=3 },
  @{ t="Вход и регистрация (Supabase Auth)"; a="u2"; s=3 },
  @{ t="Алгоритъм: прогноза на остатъка"; a="u2"; s=4 },
  @{ t="Алгоритъм: превишен бюджет + минимум 10 теста"; a="u2"; s=4 },
  @{ t="Диаграми (категории, паричен поток)"; a="u1"; s=4 },
  @{ t="Тест на сигурността (RLS) и мобилен изглед"; a="both"; s=5 },
  @{ t="Публикуване (GitHub Pages) и презентация"; a="both"; s=5 }
)

foreach ($i in $issues) {
  $who = switch ($i.a) { "u1" { "Адам Биков" } "u2" { "Реджеб Туджар" } default { "Адам Биков и Реджеб Туджар" } }
  $body = "Отговорник: $who`nЕтап: $($i.s)`n`nКритерий за готовност: резултатът е в хранилището, описан е в документацията и е проверен от двамата."
  $args = @("issue", "create", "--repo", $Repo, "--title", $i.t, "--body", $body)
  if ($i.a -ne "u2" -and $User1) { $args += @("--assignee", $User1) }
  if ($i.a -ne "u1" -and $User2) { $args += @("--assignee", $User2) }
  & gh @args
}
