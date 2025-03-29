const Binance = require("binance-api-node").default;
const fs = require("fs").promises;
const path = require("path");

// Ініціалізація клієнта Binance (API ключі не потрібні для публічних даних)
const client = Binance();

// Налаштування параметрів
const SYMBOL = "BTCUSDT";
const INTERVAL = "1m"; // Інтервал: 1m, 5m, 15m, 1h, 1d тощо
const LIMIT = 1000; // Максимум 1000 свічок за один запит
const OUTPUT_FILE = path.join(__dirname, "btcusdt_historical_data.json");

// Функція для отримання даних
async function fetchHistoricalData(startTime, endTime) {
  try {
    const candles = await client.candles({
      symbol: SYMBOL,
      interval: INTERVAL,
      limit: LIMIT,
      startTime,
      endTime,
    });

    return candles.map((candle) => ({
      timestamp: new Date(parseInt(candle.openTime)).toISOString(),
      open: parseFloat(candle.open),
      high: parseFloat(candle.high),
      low: parseFloat(candle.low),
      close: parseFloat(candle.close),
      volume: parseFloat(candle.volume),
    }));
  } catch (error) {
    console.error("Помилка при отриманні даних:", error.message);
    return [];
  }
}

// Функція для завантаження всіх даних по частинах
async function fetchAllData() {
  const allData = [];
  let startTime = new Date("2017-08-17").getTime(); // Початок торгів BTCUSDT на Binance
  const endTime = Date.now();
  let lastTimestamp = startTime;

  console.log("Починаємо завантаження даних...");

  while (lastTimestamp < endTime) {
    const data = await fetchHistoricalData(lastTimestamp, endTime);
    if (data.length === 0) break;

    allData.push(...data);
    lastTimestamp = new Date(data[data.length - 1].timestamp).getTime() + 1;

    console.log(
      `Отримано дані до ${data[data.length - 1].timestamp}, всього: ${
        allData.length
      } записів`
    );
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Затримка, щоб не перевищити ліміт запитів
  }

  return allData;
}

// Основна функція
async function main() {
  try {
    const historicalData = await fetchAllData();

    // Збереження у файл
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(historicalData, null, 2));
    console.log(`Дані збережено у файл: ${OUTPUT_FILE}`);
    console.log(`Всього записів: ${historicalData.length}`);
  } catch (error) {
    console.error("Помилка:", error.message);
  }
}

// Запуск
main();
