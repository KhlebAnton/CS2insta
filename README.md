# CS2 Insta Smokes

Готовая структура на чистом HTML / CSS / JS.

Поток:
**Карта → T/CT → карта со спавнами → lineup**

Lineup содержит:
- картинку прицеливания;
- картинку результата;
- позицию;
- тип броска (Jumpthrow и т.д.);
- цель;
- текстовую инструкцию.

## Добавление нового lineup

В `js/data.js` добавь объект в `spawns`:

```js
{
  id: 4,
  name: "New Smoke",
  x: 54,
  y: 61,
  throw: "Jumpthrow",
  target: "A Site",
  position: "T Spawn 4",
  aimImage: "./images/lineups/inferno/t/4-aim.webp",
  resultImage: "./images/lineups/inferno/t/4-result.webp",
  note: "Встань сюда, наведи прицел и сделай jumpthrow."
}
```

`x` и `y` — координаты кнопки на карте в процентах.

SVG-файлы в архиве — заглушки. Замени их своими реальными скриншотами и измени расширение в `data.js`.

## Телефон

Верстка адаптивная:
- кнопки спавнов остаются поверх карты;
- lineup открывается во весь экран;
- изображения перестраиваются в одну колонку;
- крупные touch-target кнопки;
- поддерживается `100dvh`.

## URL

Есть маршруты вида:
- `/`
- `/inferno`
- `/inferno/t`
- `/inferno/ct`

Для обычного shared-хостинга желательно включить SPA fallback на `index.html`. Если сервер не умеет fallback, логику можно перевести на hash URL.
