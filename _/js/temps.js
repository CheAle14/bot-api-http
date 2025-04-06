const DateTime = luxon.DateTime;
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
  const datestr = date.toISODate();
  const result = await fetch(`/api/temps/readings/${datestr}`);
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
    xMin: date.toMillis() + range.start,
    xMax: date.toMillis() + range.end,
  };
}

function mapSettingsOnDate(date, settings) {
  if (!settings) return null;
  return {
    date: settings.date,
    heatPeriods: settings.heatPeriods.map((period) =>
      mapTimeRangeOnDate(date, period)
    ),
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
      const [date, ...rest] = array;
      const heatPeriods = rest.map(parseTimeRange);

      return {
        date: parseDate(date),
        heatPeriods,
      };
    });

  function parseDate(val) {
    const [year, month, day] = val.split("-").map((s) => parseInt(s, 10));

    return DateTime.utc(year, month, day);
  }
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

const DATA_KEY = "temps_data";
function getSaveData() {
  const data = localStorage.getItem(DATA_KEY);
  if (data === null) {
    return {
      min: 14.0,
      max: 21.0,
    };
  } else {
    return JSON.parse(data);
  }
}

function getMinMaxData(data) {
  var { min, max } = getSaveData();

  for (const { x, y } of data) {
    if (x < min) {
      min = x;
    }
    if (y > max) {
      max = y;
    }
  }

  return { min, max };
}

async function update(date) {
  const localVal = DateTime.fromJSDate(date).startOf("day");
  const utcVal = DateTime.fromJSDate(date).toUTC().startOf("day");

  const settingsApplied = mapSettingsOnDate(
    localVal,
    rfind(settings, (v) => utcVal >= v.date)
  );

  const data = await fetchReadings(utcVal);

  const x_minmax = {
    min: localVal.toMillis(),
    max: localVal.endOf("day").toMillis(),
  };

  const y_minmax = getMinMaxData(data);

  const ctx = document.getElementById("output");

  const annotations = settingsApplied
    ? settingsApplied.heatPeriods.reduce((acc, period, idx) => {
        acc[`heat${idx}`] = period;
        return acc;
      }, {})
    : {};

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
          ...x_minmax,
          type: "time",
          time: {
            unit: "hour",
            displayFormats: {
              hour: "HH:00",
            },
          },
        },
        y: {
          ...y_minmax,
        },
      },
      plugins: {
        annotation: {
          annotations: annotations,
        },
      },
    },
  });
}

async function change_minmax(date) {
  const min = Math.round(document.getElementById("minTemp").value);
  const max = Math.round(document.getElementById("maxTemp").value);

  const data = { min, max };
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
  await update(date);
}

async function init() {
  settings = await fetchSettings();

  const showing = document.getElementById("showingDate");
  showing.onchange = async () => {
    await update(showing.valueAsDate);
  };

  const v = new Date();
  showing.valueAsDate = v;
  await update(v);

  const data = getSaveData();
  for (const id of ["minTemp", "maxTemp"]) {
    const d = document.getElementById(id);
    d.value = data[id.substring(0, 3)];
    d.addEventListener(
      "change",
      async () => await change_minmax(showing.valueAsDate)
    );
  }

  window.addEventListener("keyup", async (event) => {
    const delta = event.key === "ArrowLeft" ? -1 : 1;
    const offset = DateTime.local(showing.valueAsDate).add({ days: delta });
    showing.valueAsDate = offset;
    await update(offset);
  });
}

init();
