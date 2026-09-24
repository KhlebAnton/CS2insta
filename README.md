# Обновлённая логика CS2 Insta Smokes

Главные изменения:

- У карты рабочая картинка не обязательна. У карты есть отдельное `previewImage` для карточки выбора.
- У каждого места/стороны есть отдельное `previewImage` для карточки и своё `mapImage` для рабочей карты. Оба поля необязательны.
- У места может быть 0, 1 или много lineup-точек.
- Если у карты только одно место — экран выбора места пропускается.
- Если у места только один lineup — экран выбора точек пропускается и lineup открывается сразу.
- Если карты у места нет, несколько lineup всё равно можно хранить и выбирать списком.
- У lineup есть отдельное `previewImage` для карточки.
- У lineup теперь `aimImages: []` — можно добавить несколько картинок прицеливания.
- `aimImage` сохраняется как первый элемент для совместимости со старым форматом.
- `position` — отдельное поле «где стоять».
- Старый `data.js` автоматически мигрируется при импорте в админку.

Структура:

```js
{
  mirage: {
    name: "Mirage",
    previewImage: "./images/maps/mirage/preview.jpg", // можно не указывать
    sides: {
      "a-site": {
        label: "A Site",
        previewImage: "./images/maps/mirage/a-site-preview.jpg", // превью места
        mapImage: "./images/maps/mirage/a-site.jpg", // рабочая карта, можно не указывать
        spawns: [
          {
            id: 1,
            name: "A Smoke",
            previewImage: "./images/lineups/mirage/a/1-preview.jpg",
            x: 42,
            y: 63,
            position: "У ящика справа",
            throw: "Jumpthrow",
            target: "Край окна",
            aimImages: [
              "./images/lineups/mirage/a/1-aim-1.png",
              "./images/lineups/mirage/a/1-aim-2.png"
            ],
            resultImage: "./images/lineups/mirage/a/1-result.png",
            note: "..."
          }
        ]
      }
    }
  }
}
```


## Режим без интерактивной карты

Рабочая карта `mapImage` у места необязательна. Если её нет, точки не размещаются на карте: lineup отображаются обычными карточками с `spawn.previewImage`. Поэтому можно сделать простой сценарий:

`место / previewImage → выбор lineup → Aim → Result`

Для одного lineup карточка выбора всё равно остаётся. `side.previewImage` можно использовать как фотографию/скрин места, а `spawn.previewImage` — как превью конкретного lineup.
