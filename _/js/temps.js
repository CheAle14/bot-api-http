var chart = null;
var settings = [];

function parseAsIntAndFloat(line) {
  const date = parseInt(line[0]) * 1000;
  const temp = parseFloat(line[1]);
  return {
    x: date,
    y: temp,
  };
}

function splitCsv(line) {
  return line.split(",");
}

async function fetchReadings(date) {
  const result = await fetch(`/api/temps/readings/${date}`);
  const text = await result.text();
  return text
    .split("\n")
    .map((line) => line.trimEnd())
    .map(splitCsv)
    .map(parseAsIntAndFloat);
}

function parseHHMM(value) {
  const [hour, minute] = value.split(":");
  const minutes = parseInt(hour) * 60 + parseInt(minute);
  const seconds = minutes * 60;
  return seconds * 1000;
}

function parseTimeRange(entry) {
  const [start, end] = entry.split("-");
  return {
    start: parseHHMM(start),
    end: parseHHMM(end),
  };
}

function mapTimeRangeOnDate(date, range) {
  return {
    type: "box",
    backgroundColor: "rgba(255, 99, 132, 0.25)",
    _range: range,
    xMin: date.getTime() + range.start,
    xMax: date.getTime() + range.end,
  };
}

function mapSettingsOnDate(date, settings) {
  if (!settings) return null;
  return {
    date: settings.date,
    first: mapTimeRangeOnDate(date, settings.first),
    second: mapTimeRangeOnDate(date, settings.second),
    third: mapTimeRangeOnDate(date, settings.third),
    fourth: mapTimeRangeOnDate(date, settings.fourth),
  };
}

async function fetchSettings() {
  const result = await fetch("/api/temps/settings");
  const text = await result.text();
  return text
    .split("\n")
    .map((line) => line.trimEnd())
    .map(splitCsv)
    .map((array) => {
      const date = new Date(array[0]);
      const first = parseTimeRange(array[1]);
      const second = parseTimeRange(array[2]);
      const third = parseTimeRange(array[3]);
      const fourth = parseTimeRange(array[4]);

      return { date, first, second, third, fourth };
    });
}

function rfind(array, predicate) {
  for (var i = array.length - 1; i >= 0; i--) {
    const value = array[i];
    if (predicate(value)) {
      return value;
    }
  }
  return undefined;
}

async function update(date) {
  const dateval = new Date(date);
  const settingsApplied = mapSettingsOnDate(
    dateval,
    rfind(settings, (v) => dateval >= v.date)
  );

  const min = dateval.getTime();
  const max = min + 1000 * 3600 * 24;
  const data = await fetchReadings(date);

  const ctx = document.getElementById("output");

  const annotations = settingsApplied
    ? {
        first: settingsApplied.first,
        second: settingsApplied.second,
        third: settingsApplied.third,
        fourth: settingsApplied.fourth,
      }
    : null;

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Temperature (c)",
          parsing: false,
          data,
          backgroundColor: "rgb(255, 99, 132)",
        },
      ],
    },
    options: {
      responsive: true,
      animation: false,
      scales: {
        x: {
          min,
          max,
          type: "time",
          time: {
            unit: "hour",
            displayFormats: {
              hour: "HH:00",
            },
          },
        },
      },
      plugins: {
        annotation: {
          annotations: annotations ?? {},
        },
      },
    },
  });
}

async function init() {
  settings = await fetchSettings();
  const showing = document.getElementById("showingDate");
  showing.onchange = async () => {
    await update(showing.value);
  };
  const v = new Date().toISOString().split("T")[0];
  showing.value = v;
  await update(v);

  window.addEventListener("keyup", async (event) => {
    const delta = event.key === "ArrowLeft" ? -1 : 1;
    const date = new Date(showing.value);
    const offset = dateFns.addDays(date, delta);
    const v = offset.toISOString().split("T")[0];
    showing.value = v;
    await update(v);
  });
}

init();
