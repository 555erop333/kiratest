# Sunny English Garden

Статический сайт с 9 разделами по английскому языку для 4 класса.

## Что внутри

- `index.html` — основная страница.
- `styles.css` — оформление и анимации.
- `app.js` — логика интерфейса, очков, переводов и прогресса.
- `questionBank.js` — 9 разделов и 900 вопросов.
- `scripts/validate-question-bank.mjs` — быстрая проверка структуры банка вопросов.

## Как запустить локально

1. Открой терминал в папке проекта.
2. Запусти любой простой сервер, например:

```bash
npx serve .
```

или

```bash
python -m http.server 3000
```

3. Открой сайт в браузере.

## Запуск как Python Web Service

Если хочешь заливать проект в Render по схеме с Python web service:

- `main.py` — точка входа.
- `keep_alive.py` — Flask-обёртка, которая раздаёт текущий сайт.
- `requirements.txt` — зависимости Python.
- `render.yaml` — готовая конфигурация сервиса для Render.

Команды для Render:

- Build Command: `pip install -r requirements.txt`
- Start Command: `gunicorn main:app`

Локальный запуск через Python:

```bash
python main.py
```

После запуска сайт будет доступен на порту `4000` или на порту из переменной окружения `PORT`.

## Проверка банка вопросов

```bash
npm run validate
```

## Публикация на сервер

Это обычный статический сайт. Достаточно загрузить в корень сервера файлы:

- `index.html`
- `styles.css`
- `app.js`
- `questionBank.js`

Папка `scripts` нужна только для локальной проверки и на проде не обязательна.
