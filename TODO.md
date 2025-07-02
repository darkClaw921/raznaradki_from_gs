- при приходе вебхука нужно обновлять данные в таблице по body.data.booking.id (системная инофрмация) если их нет то создать новые записи и связать с booking.id
- кнопка три точки на таблицах на дашборде не работает для редактирования и удаления 
- не работает удалениие сразу нескольких ячеек при выделении инажатии на delete или backspace

- иногда в истории ячейки информация дублируется об одном и том же изменеии
- добавить возможность настроить формат данных для ячейк или столбцов целиком(не учитывая заголовки в первой строке) (текст, число, дата, время, валюта)
- после изменения ширины столбца изменения не сохраняются при перезагрузке страницы



- статус дома это выпадающий список с возможностью выбора из списка (Выс/Зас, Проживают, Свободен, Бронь)
- в журанале заселения доплата за проживание в день заселения должны высчитываться автоматически из общей суммы - предоплата
- нужно добавить кнопку переноса текста для ячейки (текст должен переноситься и подстраиваться под ширину ячейки) 


- добавить возможность сортировки столбцов по дате заселения и выселения

- в журанале заселения нужно добавить еще один столбец 'Комментарии по оплате и проживанию в день заселения' это поле можно редактировать только из отчета по заселению и после редактирование значение должно сохраниться в журнале заселения





- в webhook url генерирруется как http://localhost:3000/ а нужно как https://domain/
- при вставке данных с webhook ячейка доплата за проживание не пересчитывается
- Дата отчета убрать и оставить только дату
- Объединение ячеек
- Границы расширить функционал (ширина, левая правая, тип)
- Возможнось печати отчета

⏭️  Миграция 006_add_webhook_system.sql пропущена
📊 Выполняю миграцию: 007_add_booking_id_to_cells.sql
⏭️  Пропускаю миграцию 007_add_booking_id_to_cells.sql - столбец booking_id уже существует
⏭️  Миграция 007_add_booking_id_to_cells.sql пропущена
📊 Выполняю миграцию: 008_add_cell_borders_and_column_widths.sql
❌ Ошибка при выполнении миграции 008_add_cell_borders_and_column_widths.sql: Error
    at Query.run (/app/node_modules/sequelize/lib/dialects/mysql/query.js:52:25)
    at /app/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async executeMigration (/app/dist/utils/migrations.js:140:17)
    at async runMigrations (/app/dist/utils/migrations.js:172:13) {
  name: 'SequelizeDatabaseError',
  parent: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  original: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
    'ALTER TABLE cells\n' +
    "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
    "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
    "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
  parameters: {}
}
💥 Критическая ошибка при выполнении миграций: Error
    at Query.run (/app/node_modules/sequelize/lib/dialects/mysql/query.js:52:25)
    at /app/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async executeMigration (/app/dist/utils/migrations.js:140:17)
    at async runMigrations (/app/dist/utils/migrations.js:172:13) {
  name: 'SequelizeDatabaseError',
  parent: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  original: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
    'ALTER TABLE cells\n' +
    "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
    "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
    "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
  parameters: {}
}
❌ Ошибка при запуске сервера: Error
    at Query.run (/app/node_modules/sequelize/lib/dialects/mysql/query.js:52:25)
    at /app/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async executeMigration (/app/dist/utils/migrations.js:140:17)
    at async runMigrations (/app/dist/utils/migrations.js:172:13) {
  name: 'SequelizeDatabaseError',
  parent: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  original: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
    'ALTER TABLE cells\n' +
    "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
    "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
    "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
  parameters: {}
}
🔧 Подключение маршрутов...
📋 Подключаем маршруты templates... function
✅ Все маршруты подключены
✅ Подключение к базе данных установлено
🔄 Запуск автоматических миграций...
🚀 Проверка и выполнение миграций...
📊 Таблица миграций еще не существует, создаем...
📋 Выполненные миграции: 0
📁 Доступные миграции: 7
🔄 Найдено 7 новых миграций для выполнения
📊 Выполняю миграцию: 002_add_cell_history.sql
⏭️  Пропускаю миграцию 002_add_cell_history.sql - таблица cell_history уже существует
⏭️  Миграция 002_add_cell_history.sql пропущена
📊 Выполняю миграцию: 003_add_sheet_templates.sql
⏭️  Пропускаю миграцию 003_add_sheet_templates.sql - таблица sheet_templates уже существует
⏭️  Миграция 003_add_sheet_templates.sql пропущена
📊 Выполняю миграцию: 004_add_report_date.sql
⏭️  Пропускаю миграцию 004_add_report_date.sql - столбец report_date уже существует
⏭️  Миграция 004_add_report_date.sql пропущена
📊 Выполняю миграцию: 005_add_report_sources.sql
⏭️  Пропускаю миграцию 005_add_report_sources.sql - таблица report_sources уже существует
⏭️  Миграция 005_add_report_sources.sql пропущена
📊 Выполняю миграцию: 006_add_webhook_system.sql
⏭️  Пропускаю миграцию 006_add_webhook_system.sql - таблицы webhook уже существуют
⏭️  Миграция 006_add_webhook_system.sql пропущена
📊 Выполняю миграцию: 007_add_booking_id_to_cells.sql
⏭️  Пропускаю миграцию 007_add_booking_id_to_cells.sql - столбец booking_id уже существует
⏭️  Миграция 007_add_booking_id_to_cells.sql пропущена
📊 Выполняю миграцию: 008_add_cell_borders_and_column_widths.sql
❌ Ошибка при выполнении миграции 008_add_cell_borders_and_column_widths.sql: Error
    at Query.run (/app/node_modules/sequelize/lib/dialects/mysql/query.js:52:25)
    at /app/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async executeMigration (/app/dist/utils/migrations.js:140:17)
    at async runMigrations (/app/dist/utils/migrations.js:172:13) {
  name: 'SequelizeDatabaseError',
  parent: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  original: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
    'ALTER TABLE cells\n' +
    "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
    "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
    "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
  parameters: {}
}
💥 Критическая ошибка при выполнении миграций: Error
    at Query.run (/app/node_modules/sequelize/lib/dialects/mysql/query.js:52:25)
    at /app/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async executeMigration (/app/dist/utils/migrations.js:140:17)
    at async runMigrations (/app/dist/utils/migrations.js:172:13) {
  name: 'SequelizeDatabaseError',
  parent: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  original: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
    'ALTER TABLE cells\n' +
    "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
    "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
    "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
  parameters: {}
}
❌ Ошибка при запуске сервера: Error
    at Query.run (/app/node_modules/sequelize/lib/dialects/mysql/query.js:52:25)
    at /app/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async executeMigration (/app/dist/utils/migrations.js:140:17)
    at async runMigrations (/app/dist/utils/migrations.js:172:13) {
  name: 'SequelizeDatabaseError',
  parent: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  original: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
    'ALTER TABLE cells\n' +
    "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
    "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
    "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
  parameters: {}
}
🔧 Подключение маршрутов...
📋 Подключаем маршруты templates... function
✅ Все маршруты подключены
✅ Подключение к базе данных установлено
🔄 Запуск автоматических миграций...
🚀 Проверка и выполнение миграций...
📊 Таблица миграций еще не существует, создаем...
📋 Выполненные миграции: 0
📁 Доступные миграции: 7
🔄 Найдено 7 новых миграций для выполнения
📊 Выполняю миграцию: 002_add_cell_history.sql
⏭️  Пропускаю миграцию 002_add_cell_history.sql - таблица cell_history уже существует
⏭️  Миграция 002_add_cell_history.sql пропущена
📊 Выполняю миграцию: 003_add_sheet_templates.sql
⏭️  Пропускаю миграцию 003_add_sheet_templates.sql - таблица sheet_templates уже существует
⏭️  Миграция 003_add_sheet_templates.sql пропущена
📊 Выполняю миграцию: 004_add_report_date.sql
⏭️  Пропускаю миграцию 004_add_report_date.sql - столбец report_date уже существует
⏭️  Миграция 004_add_report_date.sql пропущена
📊 Выполняю миграцию: 005_add_report_sources.sql
⏭️  Пропускаю миграцию 005_add_report_sources.sql - таблица report_sources уже существует
⏭️  Миграция 005_add_report_sources.sql пропущена
📊 Выполняю миграцию: 006_add_webhook_system.sql
⏭️  Пропускаю миграцию 006_add_webhook_system.sql - таблицы webhook уже существуют
⏭️  Миграция 006_add_webhook_system.sql пропущена
📊 Выполняю миграцию: 007_add_booking_id_to_cells.sql
⏭️  Пропускаю миграцию 007_add_booking_id_to_cells.sql - столбец booking_id уже существует
⏭️  Миграция 007_add_booking_id_to_cells.sql пропущена
📊 Выполняю миграцию: 008_add_cell_borders_and_column_widths.sql
❌ Ошибка при выполнении миграции 008_add_cell_borders_and_column_widths.sql: Error
    at Query.run (/app/node_modules/sequelize/lib/dialects/mysql/query.js:52:25)
    at /app/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async executeMigration (/app/dist/utils/migrations.js:140:17)
    at async runMigrations (/app/dist/utils/migrations.js:172:13) {
  name: 'SequelizeDatabaseError',
  parent: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  original: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
    'ALTER TABLE cells\n' +
    "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
    "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
    "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
  parameters: {}
}
💥 Критическая ошибка при выполнении миграций: Error
    at Query.run (/app/node_modules/sequelize/lib/dialects/mysql/query.js:52:25)
    at /app/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async executeMigration (/app/dist/utils/migrations.js:140:17)
    at async runMigrations (/app/dist/utils/migrations.js:172:13) {
  name: 'SequelizeDatabaseError',
  parent: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  original: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
    'ALTER TABLE cells\n' +
    "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
    "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
    "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
  parameters: {}
}
❌ Ошибка при запуске сервера: Error
    at Query.run (/app/node_modules/sequelize/lib/dialects/mysql/query.js:52:25)
    at /app/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async executeMigration (/app/dist/utils/migrations.js:140:17)
    at async runMigrations (/app/dist/utils/migrations.js:172:13) {
  name: 'SequelizeDatabaseError',
  parent: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  original: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
    'ALTER TABLE cells\n' +
    "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
    "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
    "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
  parameters: {}
}
🔧 Подключение маршрутов...
📋 Подключаем маршруты templates... function
✅ Все маршруты подключены
✅ Подключение к базе данных установлено
🔄 Запуск автоматических миграций...
🚀 Проверка и выполнение миграций...
📊 Таблица миграций еще не существует, создаем...
📋 Выполненные миграции: 0
📁 Доступные миграции: 7
🔄 Найдено 7 новых миграций для выполнения
📊 Выполняю миграцию: 002_add_cell_history.sql
⏭️  Пропускаю миграцию 002_add_cell_history.sql - таблица cell_history уже существует
⏭️  Миграция 002_add_cell_history.sql пропущена
📊 Выполняю миграцию: 003_add_sheet_templates.sql
⏭️  Пропускаю миграцию 003_add_sheet_templates.sql - таблица sheet_templates уже существует
⏭️  Миграция 003_add_sheet_templates.sql пропущена
📊 Выполняю миграцию: 004_add_report_date.sql
⏭️  Пропускаю миграцию 004_add_report_date.sql - столбец report_date уже существует
⏭️  Миграция 004_add_report_date.sql пропущена
📊 Выполняю миграцию: 005_add_report_sources.sql
⏭️  Пропускаю миграцию 005_add_report_sources.sql - таблица report_sources уже существует
⏭️  Миграция 005_add_report_sources.sql пропущена
📊 Выполняю миграцию: 006_add_webhook_system.sql
⏭️  Пропускаю миграцию 006_add_webhook_system.sql - таблицы webhook уже существуют
⏭️  Миграция 006_add_webhook_system.sql пропущена
📊 Выполняю миграцию: 007_add_booking_id_to_cells.sql
⏭️  Пропускаю миграцию 007_add_booking_id_to_cells.sql - столбец booking_id уже существует
⏭️  Миграция 007_add_booking_id_to_cells.sql пропущена
📊 Выполняю миграцию: 008_add_cell_borders_and_column_widths.sql
❌ Ошибка при выполнении миграции 008_add_cell_borders_and_column_widths.sql: Error
    at Query.run (/app/node_modules/sequelize/lib/dialects/mysql/query.js:52:25)
    at /app/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async executeMigration (/app/dist/utils/migrations.js:140:17)
    at async runMigrations (/app/dist/utils/migrations.js:172:13) {
  name: 'SequelizeDatabaseError',
  parent: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  original: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
    'ALTER TABLE cells\n' +
    "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
    "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
    "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
  parameters: {}
}
💥 Критическая ошибка при выполнении миграций: Error
    at Query.run (/app/node_modules/sequelize/lib/dialects/mysql/query.js:52:25)
    at /app/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async executeMigration (/app/dist/utils/migrations.js:140:17)
    at async runMigrations (/app/dist/utils/migrations.js:172:13) {
  name: 'SequelizeDatabaseError',
  parent: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  original: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
    'ALTER TABLE cells\n' +
    "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
    "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
    "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
  parameters: {}
}
❌ Ошибка при запуске сервера: Error
    at Query.run (/app/node_modules/sequelize/lib/dialects/mysql/query.js:52:25)
    at /app/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async executeMigration (/app/dist/utils/migrations.js:140:17)
    at async runMigrations (/app/dist/utils/migrations.js:172:13) {
  name: 'SequelizeDatabaseError',
  parent: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  original: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
    'ALTER TABLE cells\n' +
    "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
    "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
    "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
  parameters: {}
}
🔧 Подключение маршрутов...
📋 Подключаем маршруты templates... function
✅ Все маршруты подключены
✅ Подключение к базе данных установлено
🔄 Запуск автоматических миграций...
🚀 Проверка и выполнение миграций...
📊 Таблица миграций еще не существует, создаем...
📋 Выполненные миграции: 0
📁 Доступные миграции: 7
🔄 Найдено 7 новых миграций для выполнения
📊 Выполняю миграцию: 002_add_cell_history.sql
⏭️  Пропускаю миграцию 002_add_cell_history.sql - таблица cell_history уже существует
⏭️  Миграция 002_add_cell_history.sql пропущена
📊 Выполняю миграцию: 003_add_sheet_templates.sql
⏭️  Пропускаю миграцию 003_add_sheet_templates.sql - таблица sheet_templates уже существует
⏭️  Миграция 003_add_sheet_templates.sql пропущена
📊 Выполняю миграцию: 004_add_report_date.sql
⏭️  Пропускаю миграцию 004_add_report_date.sql - столбец report_date уже существует
⏭️  Миграция 004_add_report_date.sql пропущена
📊 Выполняю миграцию: 005_add_report_sources.sql
⏭️  Пропускаю миграцию 005_add_report_sources.sql - таблица report_sources уже существует
⏭️  Миграция 005_add_report_sources.sql пропущена
📊 Выполняю миграцию: 006_add_webhook_system.sql
⏭️  Пропускаю миграцию 006_add_webhook_system.sql - таблицы webhook уже существуют
⏭️  Миграция 006_add_webhook_system.sql пропущена
📊 Выполняю миграцию: 007_add_booking_id_to_cells.sql
⏭️  Пропускаю миграцию 007_add_booking_id_to_cells.sql - столбец booking_id уже существует
⏭️  Миграция 007_add_booking_id_to_cells.sql пропущена
📊 Выполняю миграцию: 008_add_cell_borders_and_column_widths.sql
❌ Ошибка при выполнении миграции 008_add_cell_borders_and_column_widths.sql: Error
    at Query.run (/app/node_modules/sequelize/lib/dialects/mysql/query.js:52:25)
    at /app/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async executeMigration (/app/dist/utils/migrations.js:140:17)
    at async runMigrations (/app/dist/utils/migrations.js:172:13) {
  name: 'SequelizeDatabaseError',
  parent: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  original: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
    'ALTER TABLE cells\n' +
    "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
    "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
    "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
  parameters: {}
}
💥 Критическая ошибка при выполнении миграций: Error
    at Query.run (/app/node_modules/sequelize/lib/dialects/mysql/query.js:52:25)
    at /app/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async executeMigration (/app/dist/utils/migrations.js:140:17)
    at async runMigrations (/app/dist/utils/migrations.js:172:13) {
  name: 'SequelizeDatabaseError',
  parent: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  original: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
    'ALTER TABLE cells\n' +
    "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
    "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
    "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
  parameters: {}
}
❌ Ошибка при запуске сервера: Error
    at Query.run (/app/node_modules/sequelize/lib/dialects/mysql/query.js:52:25)
    at /app/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async executeMigration (/app/dist/utils/migrations.js:140:17)
    at async runMigrations (/app/dist/utils/migrations.js:172:13) {
  name: 'SequelizeDatabaseError',
  parent: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  original: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
    'ALTER TABLE cells\n' +
    "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
    "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
    "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
  parameters: {}
}
🔧 Подключение маршрутов...
📋 Подключаем маршруты templates... function
✅ Все маршруты подключены
✅ Подключение к базе данных установлено
🔄 Запуск автоматических миграций...
🚀 Проверка и выполнение миграций...
📊 Таблица миграций еще не существует, создаем...
📋 Выполненные миграции: 0
📁 Доступные миграции: 7
🔄 Найдено 7 новых миграций для выполнения
📊 Выполняю миграцию: 002_add_cell_history.sql
⏭️  Пропускаю миграцию 002_add_cell_history.sql - таблица cell_history уже существует
⏭️  Миграция 002_add_cell_history.sql пропущена
📊 Выполняю миграцию: 003_add_sheet_templates.sql
⏭️  Пропускаю миграцию 003_add_sheet_templates.sql - таблица sheet_templates уже существует
⏭️  Миграция 003_add_sheet_templates.sql пропущена
📊 Выполняю миграцию: 004_add_report_date.sql
⏭️  Пропускаю миграцию 004_add_report_date.sql - столбец report_date уже существует
⏭️  Миграция 004_add_report_date.sql пропущена
📊 Выполняю миграцию: 005_add_report_sources.sql
⏭️  Пропускаю миграцию 005_add_report_sources.sql - таблица report_sources уже существует
⏭️  Миграция 005_add_report_sources.sql пропущена
📊 Выполняю миграцию: 006_add_webhook_system.sql
⏭️  Пропускаю миграцию 006_add_webhook_system.sql - таблицы webhook уже существуют
⏭️  Миграция 006_add_webhook_system.sql пропущена
📊 Выполняю миграцию: 007_add_booking_id_to_cells.sql
⏭️  Пропускаю миграцию 007_add_booking_id_to_cells.sql - столбец booking_id уже существует
⏭️  Миграция 007_add_booking_id_to_cells.sql пропущена
📊 Выполняю миграцию: 008_add_cell_borders_and_column_widths.sql
❌ Ошибка при выполнении миграции 008_add_cell_borders_and_column_widths.sql: Error
    at Query.run (/app/node_modules/sequelize/lib/dialects/mysql/query.js:52:25)
    at /app/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async executeMigration (/app/dist/utils/migrations.js:140:17)
    at async runMigrations (/app/dist/utils/migrations.js:172:13) {
  name: 'SequelizeDatabaseError',
  parent: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  original: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
    'ALTER TABLE cells\n' +
    "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
    "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
    "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
  parameters: {}
}
💥 Критическая ошибка при выполнении миграций: Error
    at Query.run (/app/node_modules/sequelize/lib/dialects/mysql/query.js:52:25)
    at /app/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async executeMigration (/app/dist/utils/migrations.js:140:17)
    at async runMigrations (/app/dist/utils/migrations.js:172:13) {
  name: 'SequelizeDatabaseError',
  parent: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  original: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
    'ALTER TABLE cells\n' +
    "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
    "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
    "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
  parameters: {}
}
❌ Ошибка при запуске сервера: Error
    at Query.run (/app/node_modules/sequelize/lib/dialects/mysql/query.js:52:25)
    at /app/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async executeMigration (/app/dist/utils/migrations.js:140:17)
    at async runMigrations (/app/dist/utils/migrations.js:172:13) {
  name: 'SequelizeDatabaseError',
  parent: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  original: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
    'ALTER TABLE cells\n' +
    "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
    "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
    "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
  parameters: {}
}
🔧 Подключение маршрутов...
📋 Подключаем маршруты templates... function
✅ Все маршруты подключены
✅ Подключение к базе данных установлено
🔄 Запуск автоматических миграций...
🚀 Проверка и выполнение миграций...
📊 Таблица миграций еще не существует, создаем...
📋 Выполненные миграции: 0
📁 Доступные миграции: 7
🔄 Найдено 7 новых миграций для выполнения
📊 Выполняю миграцию: 002_add_cell_history.sql
⏭️  Пропускаю миграцию 002_add_cell_history.sql - таблица cell_history уже существует
⏭️  Миграция 002_add_cell_history.sql пропущена
📊 Выполняю миграцию: 003_add_sheet_templates.sql
⏭️  Пропускаю миграцию 003_add_sheet_templates.sql - таблица sheet_templates уже существует
⏭️  Миграция 003_add_sheet_templates.sql пропущена
📊 Выполняю миграцию: 004_add_report_date.sql
⏭️  Пропускаю миграцию 004_add_report_date.sql - столбец report_date уже существует
⏭️  Миграция 004_add_report_date.sql пропущена
📊 Выполняю миграцию: 005_add_report_sources.sql
⏭️  Пропускаю миграцию 005_add_report_sources.sql - таблица report_sources уже существует
⏭️  Миграция 005_add_report_sources.sql пропущена
📊 Выполняю миграцию: 006_add_webhook_system.sql
⏭️  Пропускаю миграцию 006_add_webhook_system.sql - таблицы webhook уже существуют
⏭️  Миграция 006_add_webhook_system.sql пропущена
📊 Выполняю миграцию: 007_add_booking_id_to_cells.sql
⏭️  Пропускаю миграцию 007_add_booking_id_to_cells.sql - столбец booking_id уже существует
⏭️  Миграция 007_add_booking_id_to_cells.sql пропущена
📊 Выполняю миграцию: 008_add_cell_borders_and_column_widths.sql
❌ Ошибка при выполнении миграции 008_add_cell_borders_and_column_widths.sql: Error
    at Query.run (/app/node_modules/sequelize/lib/dialects/mysql/query.js:52:25)
    at /app/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async executeMigration (/app/dist/utils/migrations.js:140:17)
    at async runMigrations (/app/dist/utils/migrations.js:172:13) {
  name: 'SequelizeDatabaseError',
  parent: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  original: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
    'ALTER TABLE cells\n' +
    "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
    "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
    "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
  parameters: {}
}
💥 Критическая ошибка при выполнении миграций: Error
    at Query.run (/app/node_modules/sequelize/lib/dialects/mysql/query.js:52:25)
    at /app/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async executeMigration (/app/dist/utils/migrations.js:140:17)
    at async runMigrations (/app/dist/utils/migrations.js:172:13) {
  name: 'SequelizeDatabaseError',
  parent: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  original: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
    'ALTER TABLE cells\n' +
    "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
    "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
    "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
  parameters: {}
}
❌ Ошибка при запуске сервера: Error
    at Query.run (/app/node_modules/sequelize/lib/dialects/mysql/query.js:52:25)
    at /app/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async executeMigration (/app/dist/utils/migrations.js:140:17)
    at async runMigrations (/app/dist/utils/migrations.js:172:13) {
  name: 'SequelizeDatabaseError',
  parent: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  original: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
    'ALTER TABLE cells\n' +
    "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
    "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
    "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
  parameters: {}
}
🔧 Подключение маршрутов...
📋 Подключаем маршруты templates... function
✅ Все маршруты подключены
✅ Подключение к базе данных установлено
🔄 Запуск автоматических миграций...
🚀 Проверка и выполнение миграций...
📊 Таблица миграций еще не существует, создаем...
📋 Выполненные миграции: 0
📁 Доступные миграции: 7
🔄 Найдено 7 новых миграций для выполнения
📊 Выполняю миграцию: 002_add_cell_history.sql
⏭️  Пропускаю миграцию 002_add_cell_history.sql - таблица cell_history уже существует
⏭️  Миграция 002_add_cell_history.sql пропущена
📊 Выполняю миграцию: 003_add_sheet_templates.sql
⏭️  Пропускаю миграцию 003_add_sheet_templates.sql - таблица sheet_templates уже существует
⏭️  Миграция 003_add_sheet_templates.sql пропущена
📊 Выполняю миграцию: 004_add_report_date.sql
⏭️  Пропускаю миграцию 004_add_report_date.sql - столбец report_date уже существует
⏭️  Миграция 004_add_report_date.sql пропущена
📊 Выполняю миграцию: 005_add_report_sources.sql
⏭️  Пропускаю миграцию 005_add_report_sources.sql - таблица report_sources уже существует
⏭️  Миграция 005_add_report_sources.sql пропущена
📊 Выполняю миграцию: 006_add_webhook_system.sql
⏭️  Пропускаю миграцию 006_add_webhook_system.sql - таблицы webhook уже существуют
⏭️  Миграция 006_add_webhook_system.sql пропущена
📊 Выполняю миграцию: 007_add_booking_id_to_cells.sql
⏭️  Пропускаю миграцию 007_add_booking_id_to_cells.sql - столбец booking_id уже существует
⏭️  Миграция 007_add_booking_id_to_cells.sql пропущена
📊 Выполняю миграцию: 008_add_cell_borders_and_column_widths.sql
❌ Ошибка при выполнении миграции 008_add_cell_borders_and_column_widths.sql: Error
    at Query.run (/app/node_modules/sequelize/lib/dialects/mysql/query.js:52:25)
    at /app/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async executeMigration (/app/dist/utils/migrations.js:140:17)
    at async runMigrations (/app/dist/utils/migrations.js:172:13) {
  name: 'SequelizeDatabaseError',
  parent: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  original: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
    'ALTER TABLE cells\n' +
    "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
    "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
    "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
  parameters: {}
}
💥 Критическая ошибка при выполнении миграций: Error
    at Query.run (/app/node_modules/sequelize/lib/dialects/mysql/query.js:52:25)
    at /app/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async executeMigration (/app/dist/utils/migrations.js:140:17)
    at async runMigrations (/app/dist/utils/migrations.js:172:13) {
  name: 'SequelizeDatabaseError',
  parent: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  original: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
    'ALTER TABLE cells\n' +
    "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
    "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
    "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
  parameters: {}
}
❌ Ошибка при запуске сервера: Error
    at Query.run (/app/node_modules/sequelize/lib/dialects/mysql/query.js:52:25)
    at /app/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async executeMigration (/app/dist/utils/migrations.js:140:17)
    at async runMigrations (/app/dist/utils/migrations.js:172:13) {
  name: 'SequelizeDatabaseError',
  parent: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  original: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
    'ALTER TABLE cells\n' +
    "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
    "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
    "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
  parameters: {}
}
🔧 Подключение маршрутов...
📋 Подключаем маршруты templates... function
✅ Все маршруты подключены
✅ Подключение к базе данных установлено
🔄 Запуск автоматических миграций...
🚀 Проверка и выполнение миграций...
📊 Таблица миграций еще не существует, создаем...
📋 Выполненные миграции: 0
📁 Доступные миграции: 7
🔄 Найдено 7 новых миграций для выполнения
📊 Выполняю миграцию: 002_add_cell_history.sql
⏭️  Пропускаю миграцию 002_add_cell_history.sql - таблица cell_history уже существует
⏭️  Миграция 002_add_cell_history.sql пропущена
📊 Выполняю миграцию: 003_add_sheet_templates.sql
⏭️  Пропускаю миграцию 003_add_sheet_templates.sql - таблица sheet_templates уже существует
⏭️  Миграция 003_add_sheet_templates.sql пропущена
📊 Выполняю миграцию: 004_add_report_date.sql
⏭️  Пропускаю миграцию 004_add_report_date.sql - столбец report_date уже существует
⏭️  Миграция 004_add_report_date.sql пропущена
📊 Выполняю миграцию: 005_add_report_sources.sql
⏭️  Пропускаю миграцию 005_add_report_sources.sql - таблица report_sources уже существует
⏭️  Миграция 005_add_report_sources.sql пропущена
📊 Выполняю миграцию: 006_add_webhook_system.sql
⏭️  Пропускаю миграцию 006_add_webhook_system.sql - таблицы webhook уже существуют
⏭️  Миграция 006_add_webhook_system.sql пропущена
📊 Выполняю миграцию: 007_add_booking_id_to_cells.sql
⏭️  Пропускаю миграцию 007_add_booking_id_to_cells.sql - столбец booking_id уже существует
⏭️  Миграция 007_add_booking_id_to_cells.sql пропущена
📊 Выполняю миграцию: 008_add_cell_borders_and_column_widths.sql
❌ Ошибка при выполнении миграции 008_add_cell_borders_and_column_widths.sql: Error
    at Query.run (/app/node_modules/sequelize/lib/dialects/mysql/query.js:52:25)
    at /app/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async executeMigration (/app/dist/utils/migrations.js:140:17)
    at async runMigrations (/app/dist/utils/migrations.js:172:13) {
  name: 'SequelizeDatabaseError',
  parent: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  original: Error: Duplicate column name 'border_left'
      at Packet.asError (/app/node_modules/mysql2/lib/packets/packet.js:740:17)
      at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:26)
      at Connection.handlePacket (/app/node_modules/mysql2/lib/base/connection.js:475:34)
      at PacketParser.onPacket (/app/node_modules/mysql2/lib/base/connection.js:93:12)
      at PacketParser.executeStart (/app/node_modules/mysql2/lib/packet_parser.js:75:16)
      at Socket.<anonymous> (/app/node_modules/mysql2/lib/base/connection.js:100:25)
      at Socket.emit (node:events:517:28)
      at addChunk (node:internal/streams/readable:368:12)
      at readableAddChunk (node:internal/streams/readable:341:9)
      at Readable.push (node:internal/streams/readable:278:10) {
    code: 'ER_DUP_FIELDNAME',
    errno: 1060,
    sqlState: '42S21',
    sqlMessage: "Duplicate column name 'border_left'",
    sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
      'ALTER TABLE cells\n' +
      "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
      "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
      "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
    parameters: undefined
  },
  sql: '-- Добавление полей для границ ячеек и ширины столбцов\n' +
    'ALTER TABLE cells\n' +
    "  ADD COLUMN border_left VARCHAR(20) COMMENT 'Тип левой границы (solid, dashed, none и т.д.)' AFTER merged_with,\n" +
    "  ADD COLUMN border_right VARCHAR(20) COMMENT 'Тип правой границы' AFTER border_left,\n" +
    "  ADD COLUMN border_type VARCHAR(20) COMMENT 'Тип общей границы (например, double, dotted и т.д.)' AFTER border_right;",
  parameters: {}
}
💥 Критическая ошибка при выполнении миграций: Error
    at Query.run (/app/node_mod