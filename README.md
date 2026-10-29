# lego-pro — контекст для новой сессии

Прочитай этот файл целиком перед первой правкой. Это ERP-фронтенд для производства (товары, склады, станки, заявки, касса), заказчик пишет по-русски, интерфейс на узбекском (латиница).

## 1. Стек и запуск

- React 18 + Vite 5, Chakra UI **v3** (не v2!), Tailwind 3, Redux Toolkit + RTK Query, axios, react-icons/lu + lucide-react.
- Бэкенд: `https://samarqand-erp.oybeksay.uz/api/v1`, захардкожен в `src/store/api.js`. OpenAPI: `https://samarqand-erp.oybeksay.uz/v3/api-docs` (при 502 бэкенд перезапускается, повторить через `curl --max-time 10` в цикле; `timeout` на macOS нет).
- Скрипты: `npm run dev`, `npm run dev:lan` (vite `--host 0.0.0.0`, для телефона/планшета по Wi-Fi, адрес вида `http://192.168.x.x:5173/`), `npm run build`.
- Деплой: Netlify из `origin/main` (`netlify.toml`, `NODE_VERSION=20`, SPA-редирект). Пуш в `main` = прод.
- В сборку зашит штамп `__APP_BUILD__ {hash,time}` (`vite.config.js` define, печатается `console.info` в `main.jsx`). Если «на проде не работает», сначала сравнить хеш в консоли прода с `git log -1`.
- `rollup` пришпилен `^4.64.7` в devDependencies: Rollup 4.27 при tree-shaking терял поля объектов внутри `async`/`try` и ломал PUT-запросы только в проде. Не откатывать.

## 2. Как проверять и сдавать работу

1. `npx eslint <изменённые файлы> --rule '{"no-undef":"error"}'` — в проекте много старых ошибок (prop-types, unused), новых не добавлять, старые не чинить без просьбы. `no-undef` обязателен: уже ловили `Spinner is not defined` в рантайме.
2. `npx vite build` обязан проходить.
3. В браузере залогиниться нельзя (нужен пароль устройства), визуально проверяются только автономные HTML (печать) через временный статический сервер в `.claude/launch.json`; после проверки файл вернуть: `git checkout -- .claude/launch.json`.
4. После каждой законченной задачи — **коммит и пуш в `origin/main`** (владелец так просил с середины работы). Сообщение коммита на английском, коротко: `Product: rubber field in create/edit, list, detail`.
5. В рабочем дереве могут лежать чужие незакоммиченные правки владельца или параллельной сессии (сейчас: удалённые папки `smeta/`, `uds-texnopark/`, работа над категориями станков `machineCategory.api.js`). Их не откатывать и в свои коммиты не включать: `git add` только свои файлы, поимённо, отдельными аргументами (не одной строкой).

## 3. Как работает владелец

Короткие просьбы по-русски с узбекскими названиями экранов («в махсулот», «у омборчи», «в режиме ходим»). Часто присылает кусок Swagger/JSON как спецификацию — это источник правды, лишние поля не выдумывать. Ожидает:
- «профессиональный» UI в стиле уже переписанных страниц (карточки, шапка с подписанными кнопками, чипы фильтров, скелетоны);
- простые узбекские слова вместо бухгалтерских терминов;
- минимум модалок там, где можно сделать одно нажатие;
- обычные формы (select/input), а не «кнопочные» тогглы;
- всё работает в тёмной и светлой теме.
Если просьба двусмысленная, он быстро поправляет («нет, я имел в виду вид из станка») — делать компактно и переделывать без споров. Иногда пишет сообщение не сессии («отмена, не тебе») — просто не действовать.

## 4. Карта проекта

```
src/
  app/
    layout/        MainLayout (admin/кассир/бухгалтер/заявочник/склад/химик), StanokchiLayout,
                   HeadStanokchiLayout (станочник-руководитель), WorkerStanokchiLayout (киоск рабочего), MixerLayout
    navigation/    sidebar.config.js — пункты и группы меню по ролям (exact:true у дашбордов)
    permissions/   roles.js — ROLES и группы ролей (PRODUCT_WAREHOUSE_ROLES, BUXGALTER_ROLES, ...)
    router/        routes.config.js — все маршруты с массивом roles; RoleGuard; AppRouter
  Components/
    Common/        общие экраны: Product, ProductDetail, ProductPrices, ProductCategory, ProductColor, Brand,
                   Customer, CustomerDetail, CustomerAgent, CustomerReconciliation, Supplier(+Detail),
                   Expense(+Detail, +Category), Cashbox(+Detail), Machine(+Detail), Raw, Recipe,
                   WarehousePage/WarehouseDetail, Reminder, User, Role, Device, Settings, Login, Profile
    Zayavkachi/    заявки: Orders, OrderDetail, OrderCreate/Edit, BuxgalterOrderDetail, Customers,
                   __components/OrderForm.jsx, statusBadge.js, OrderPrintModal.jsx
    Staff/         товарный склад: StockWarehouse, Income, Outcome, History, Orders, OrderDetail (отгрузка),
                   __components/StockTransactionForm.jsx, orderReceipt.js
    RawStaff/      склад сырья
    Stanokchi/     станки: Dashboard, Machines/HeadMachines, MachineDetail/HeadMachineDetail + StartProductPicker,
                   Worker/WorkerMachines + WorkerMachineDetail (киоск), productionWarehouse.jsx, shift.js, StanokchiHeader
    Kassir/, Ximik/, Mixer/  дашборды и обёртки ролей
    Other/         Sidebar, Header'ы, Alert, старые UI-утилиты
    ui/            переиспользуемое: FormControl, FormattedNumberInput, FilterCombobox, ColorSwatch, ProductImage,
                   CurrencyAmountField, FullscreenButton, LabelPrintButton/Dialog, useInfiniteList + InfiniteSentinel,
                   date-format.js, number-format.js, order-items.js, currency.js, auth-image.js, color-utils.js
  services/labelPrinter.js   QZ Tray (печать этикеток)
  store/
    api.js                   axios-инстанс с токеном
    baseQuary/axiosBaseQuery.js  обёртка для RTK Query (headers, responseType, schema)
    baseQuary/updateSchemas.js   схемы PUT-запросов (см. §5.2)
    services/*.api.js        один createApi на сущность, все подключены в store/index.js
    slices/                  auth и т.п.
  theme/tokens.js            useAppTheme(): isDark, cardBg, cardBorder, textColor, subtitleColor, accentColor
  index.css                  глобальные стили (таблицы с !important, спиннеры number, .sverka-paper, stock-row-*)
```

Роли (`roles.js`, бэкенд отдаёт UPPERCASE, при логине `toLowerCase()`): `manager` (админ), `buxgalter` (хисобчи), `zayavkachi`, `kassir`, `product_storekeeper` (омборчи), `raw_material_storekeeper`, `stanokchi`, `mikserchi`, `ximik`. Префиксы URL по ролям (`/kassir/...`, `/stanokchi/...`); общие экраны узнают роль через `useAppSelector(s => s.auth.role)` и префикс через `useLocation().pathname`. Маршруты с `STANOKCHI`/`MIKSERCHI` в `roles` `AppRouter` уводит в отдельный layout — эти роли нельзя добавлять к общим путям менеджера.

Схема добавления роли: `roles.js` → `RoleGuard.jsx` → `Login/index.jsx` (редирект захардкожен) → `sidebar.config.js` и `Sidebar.jsx` → `routes.config.js` → подписи в `Common/Role` и `Common/User`.

## 5. Паттерны, которых держаться

### 5.1 RTK Query
- `transformResponse` → `{ items: response.data, pagination: response.pagination }` для списков, `response.data` для одиночных.
- Теги: `{type, id:'LIST'}` + по id. После мутаций, которые меняют чужие сущности (заказ → баланс клиента, платежи, касса, станок), в `onQueryStarted` диспатчится `otherApi.util.invalidateTags([...])` (см. `salesOrder.api.js` → `refreshCustomerAndPayments`, `productStock.api.js` → Machine/MachineOutput). Любая новая мутация обязана обновлять всё, что видит пользователь без F5 — владелец это проверяет.
- `normalizeSalesOrder` в `salesOrder.api.js` разворачивает объект `customer` в плоские поля (`customerName`, `customerPhone`, `customerAddress`, `regionName`, `agentName`).

### 5.2 PUT-запросы и схема полей
Бэкенд на PUT требует **все обязательные поля** и ругается «null не допускается», если фронт шлёт частичный объект. Решение: в `*.api.js` у мутации `schema: 'XxxUpdateRequest'`, `axiosBaseQuery` прогоняет тело через `shapeUpdatePayload` (`updateSchemas.js`): проверка обязательных (блокирует с узбекским сообщением «… majburiy maydonlar to‘ldirilmagan»), удаление неизвестных полей, `'' → null` для опциональных. Формы Edit гидрируются из `GET /{id}` (`useGetXxxByIdQuery` + `fillBlanks`), а не из строки списка. При новом поле на бэкенде — добавить его и в схему, и в форму.

### 5.3 Списки
- Бесконечная прокрутка: `useInfiniteList` + `<InfiniteSentinel/>`; компонент держит `page`, передаёт `items, pagination, isFetching, resetKey` (строка из фильтров). Полный лоадер только при `isLoading || (isFetching && items.length===0)`. Внутри хука `lastPageRef` + `seenPagesRef` (WeakMap массив→страница), чтобы при refetch той же страницы сброситься на 0, а при переходе страниц — нет (RTK на миг отдаёт предыдущий `data`). Та же логика продублирована локально в `Product/index.jsx`, `StockWarehouse`, `OrderForm`, `StockTransactionForm` — менять синхронно.
- Фильтры: `FilterCombobox` (поиск без учёта апострофов `normalizeSearch`), чипы активных фильтров, быстрые периоды дат. Поиск клиента в `OrderForm` гибридный: одна строка ищет по имени, телефону, адресу, региону (базовый список size 200 + серверный поиск по имени, слияние).
- Числовые поля: `FormattedNumberInput` (разделители тысяч). Пачки/штуки показывают пустое поле вместо `0`. Спиннеры у `input[type=number]` скрыты глобально в `index.css`, прокрутка колесом над числовыми полями отключена в `main.jsx`.

### 5.4 UI
- Chakra v3: `bg="linear-gradient(...)"` (не `bgGradient="linear(...)"`), `Dialog.Root/Backdrop/Positioner/Content`, `Field.Root/Label/HelperText`, `colorPalette`.
- Tailwind preflight обнуляет паддинг `button`, поэтому кнопкам Chakra всегда явные `h` и `px`; иконочные кнопки `w="34px" h="34px" p={0} minW={0}`.
- Глобальные правила `index.css` для `table thead th` / `tbody td` с `!important` перебивают инлайн-фон ячеек: для цветных строк использовать классы (`stock-row-low`, `stock-row-out`).
- Цвета/токены только из `useAppTheme()`; документы для печати всегда белые (`.sverka-paper`).
- Даты через `src/Components/ui/date-format.js`, не `toLocaleString('uz-UZ')`.
- Клавиатурные события из портальных модалок всплывают на карточку под ними: в обработчиках карточек проверять `event.target === event.currentTarget`.
- Общие фичи шапки: `FullscreenButton` (`lockKeyboard` блокирует Esc через `navigator.keyboard.lock`) стоит во всех header'ах и layout'ах.

### 5.5 Доступы на фронте
- `Zayavkachi/__components/statusBadge.js`: `STATUS_LABEL` (CREATED Yangi, LOADED Ortildi, CONFIRMED Tugallandi, REJECTED Bekor qilindi, RETURNED Qaytarildi), `canSetOrderStatus(role, next)` — `LOADED` ставит только омборчи, `canReturnOrder` — manager и buxgalter.
- Редактирование цен заявки в `LOADED`: `canEditPrice` для buxgalter, zayavkachi, manager, kassir (бэкенд пока не даёт `SALES_ORDER:PRICE` заявочнику — покажет 403).
- `/products/prices` (массовое изменение цен) — manager и buxgalter в роутах, но `PRODUCT:UPDATE` на бэкенде есть только у manager.
- Печать этикетки показывается по роли, список permissions с бэкенда фронт не получает; 403 превращается в понятное сообщение.

## 6. Факты о бэкенде, которые уже проверены

- `POST /sales-orders/{id}/load` сам списывает остатки по строкам и ставит `LOADED`. Отдельный `OUT` делать нельзя (было двойное списание). Переходы: `/load`, `/confirm`, `/reject`, `/return` (возврат частичный или полный, только admin/бухгалтер). Статусов `PENDING`/`APPROVED` нет. Удаление заявки — только `CREATED` (иначе 409).
- `PATCH /sales-orders/{id}/prices` только для `LOADED`.
- Строки заявки: одна на `(productId, warehouseId)` с `packQuantity`, `pieceQuantity`, в ответе ещё `quantity` (итог в штуках). Помощники `ui/order-items.js`.
- `POST /product-stock-transactions`: `action: IN|OUT` (`PRODUCE` удалён), `warehouseId` обязателен всегда, `machineId` только с `IN`, `items[{productId, quantity, unit: PACK|PIECE}]`. Станочник при «+1» шлёт `IN`, `unit:'PACK'`, `quantity:1`, `warehouseId` из выбранного склада производства (`useProductionWarehouse`, localStorage `production_warehouse_id`).
- `PATCH /products/prices {items:[{productId, price}]}` — массовые цены.
- Товар: `rubber: boolean|null` (резина/уплотнитель), `category.bonusPrice` (бонус переехал из товара в категорию), `article`, `size`, `brandId`, `piecesPerPack` (обязателен, целое ≥1), `price` опционален, `warehouseId`/`lowProductAlert` в PUT не отправлять. Фото: `POST /products/{id}/image` multipart с явным `Content-Type`, картинки под токеном (`ProductImage`, `auth-image.js`, `?v=` против кэша).
- Этикетка: `GET /products/{id}/label?copies=N → data.tsplBase64` (готовый TSPL, фронт штрих-код не рисует). `GET /qz-tray/certificate`, `POST /qz-tray/sign {request}` для подписи QZ. Печать идёт через QZ Tray на ПК (`services/labelPrinter.js`), принтер сохраняется в `localStorage['label_printer_name']`, настройка в Sozlamalar → «Yorliq printeri». Рабочий при «+1» печатает `LABEL_COPIES = 2`; если принтер не найден — открывается `LabelPrintDialog`.
- Платежи: `currency` (`UZS|USD`) обязателен в `POST /payments`, `POST/PUT /expenses`, `POST /supplier-payments`; `amount` всегда в сумах, при `USD` нужен `usdRate` (`CurrencyAmountField`, курс в `localStorage['payment_usd_rate']`). `expenseDate` только дата, время бэкенд не принимает.
- Клиент: объекты `agent {id,name}` и `region {id,name}`, фильтры `agentId`, `regionId`, `balance` редактируется и в create, и в edit.
- Станки: `GET /machines` отдаёт реальное состояние и `currentRun` (время работы считаем на фронте, `elapsedLabel`); `GET /machines/production-summary` за смену (`shift.js`: день 08:00–20:00, ночь 20:00–08:00 Ташкент). Статус `DEFECT` в киоске рабочего скрыт. В работе (не закоммичено): категории станков `/machine-categories`, `categoryId` у станка и в фильтрах.
- Права бэкенда, о которых владелец знает: `SALES_ORDER:PRICE` у buxgalter/kassir/manager; `PRODUCT:UPDATE` только manager; `STOCK:WRITE` у manager, storekeeper, stanokchi; `PRODUCT:LABEL` для печати.

## 7. Что уже сделано (кратко, чтобы не переделывать)

- Роли и дашборды: кассир (без заказов; быстрые Kirim/Chiqim в шапке), химик (рецепты и сырьё полностью, остальное просмотр; страница склада сырья, поставщики с пополнением баланса), станочник-руководитель и рабочий.
- Детальные страницы в едином стиле: Supplier, Customer (вкладки заказы/платежи), Expense, Cashbox, Product, Machine (бесконечная прокрутка, колонка времени работы), Warehouse.
- Акт сверки `CustomerReconciliation` (PNG «как в 1С» через html2canvas, `COMPANY_NAME = 'Zafar Lux'`).
- Товары: цвет HEX (`ColorSwatch`, `ColorDot`), фото, резина, бонус из категории, кнопка «Narxlarni o‘zgartirish» → страница массовых цен (режимы +/−/+%/−%/=, округление, выбор строк, мемоизированные строки), печать этикетки в списке и деталях.
- Заявки (`OrderForm`): выбор товара тогглом с чипами, ввод «пачки + штуки» с автосплитом, обязательное количество (по умолчанию 0), сортировка по остатку (есть → мало → нет), чип цвета, гибридный поиск клиента, редактирование цен в `LOADED`; списки заявок с колонками телефон/адрес/агент и поиском по ним; возврат заказа; напоминания об оплате с бесконечной прокруткой.
- Склад (`Staff`): отгрузка одним вызовом `/load` с чеклистом сканирования и «+ dona / + pachka»; чек отгрузки `orderReceipt.js` (форматы 100×60 / A4 / термо, только названия категорий, без штрих-кода), печать через скрытый iframe; история операций; ручной приход `Income` (та же форма доступна станочнику-руководителю по `/stanokchi/income`).
- Киоск станочника (`WorkerStanokchiLayout`): без шапки, 8 станков без прокрутки (`landscape:` 4×2 / `portrait:` 2×4), карточка «логотип бренда + фото товара сверху, инфо снизу», выбор склада, тема, полноэкранный режим с блокировкой Esc, выход с подтверждением, опрос каждые 30 с.
- Общее: бесконечная прокрутка на всех списках, фильтр-комбобоксы, полноэкранная кнопка во всех шапках, убраны спиннеры number, единая схема PUT, аудит инвалидации кэшей после create/edit.

## 8. Ловушки, которые уже всплывали

- Rollup 4.27 выкидывал поля объектов (см. §1) — симптом «на localhost работает, в проде null».
- Python-патчи через f-string с фигурными скобками JSX падали `SyntaxError` и ничего не применяли — для массовых правок использовать конкатенацию строк или обычные Edit.
- `sed` с комментарием в конце строки съедал запятую. Проверять diff.
- В файлах с несколькими `return (` (скелетон + основной рендер) вставлять по якорю основного wrapper'а, а не по последнему `return`.
- zsh ругается на `--include=*.jsx` без кавычек.
- Иконки `lucide-react` и `react-icons/lu` обе используются; перед использованием компонента убедиться, что он импортирован (eslint `no-undef`).
- `withMT` из material-tailwind вырезал семейства цветов Tailwind; они возвращены в `tailwind.config.js`, не удалять.

## 9. Текущее состояние

Последний коммит на `origin/main` — см. `git log -1`. Все просьбы владельца из предыдущих сессий выполнены и запушены. В рабочем дереве есть незакоммиченная параллельная работа по категориям станков (`src/store/services/machineCategory.api.js`, правки `machine.api.js`, `store/index.js`, `updateSchemas.js`) и удаление лишних папок `smeta/`, `uds-texnopark/` — это не твоё, не трогать и не откатывать.
