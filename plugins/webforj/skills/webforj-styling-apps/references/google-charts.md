# Google Charts Theming in webforJ

Google Charts render in `<canvas>` / `<svg>`, not in the DOM. `--dwc-*` CSS
custom properties do not apply. All chart styling is done through an options
object — `Map<String, Object>` via `chart.setOptions(options)`.

Store chart options in `google-charts-theme.json` alongside the CSS in
`resources/static/`, load via `Assets.contentOf()` + Gson.

## Example Theme

```json
{
  "hAxis": {
    "titleTextStyle": { "color": "#607d8b" },
    "gridlines": { "count": 0 },
    "textStyle": { "color": "#607d8b", "fontSize": "12", "bold": true }
  },
  "vAxis": {
    "titleTextStyle": { "color": "#607d8b" },
    "gridlines": { "color": "#e0e0e0" },
    "textStyle": { "color": "#607d8b", "fontSize": "12", "bold": true }
  },
  "legend": {
    "position": "top",
    "alignment": "center",
    "textStyle": { "color": "#607d8b", "fontSize": "12", "bold": true }
  },
  "colors": [
    "#006fe6", "#8f64e0", "#ce55ca", "#fa49ab",
    "#ff4d85", "#ff655e", "#ff8537", "#ffa600"
  ],
  "areaOpacity": 0.24,
  "lineWidth": 1,
  "backgroundColor": "transparent",
  "chartArea": { "backgroundColor": "transparent" },
  "bar": { "groupWidth": "40" },
  "colorAxis": {
    "colors": ["#006fe6", "#8f64e0", "#ce55ca", "#fa49ab"]
  }
}
```

Place at `src/main/resources/static/google-charts-theme.json` (alongside the CSS).

## Loading in Java

```java
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.webforj.utilities.Assets;

Map<String, Object> theme = new Gson().fromJson(
    Assets.contentOf(Assets.resolveContextUrl("context://static/google-charts-theme.json")),
    new TypeToken<Map<String, Object>>() {}.getType());

GoogleChart chart = new GoogleChart(GoogleChart.Type.COLUMN);
chart.setData(data);
chart.setOptions(theme);
```

Gson is a transitive dependency from `webforj-googlecharts`.

## Applying the theme to existing charts

Every chart must use the theme as its base options. Replace
`new HashMap<>()` with the loaded theme, then apply chart-specific
overrides on top with `put()` — they win naturally.

```java
// Before
Map<String, Object> options = new HashMap<>();
options.put("chartArea", Map.of(...));
options.put("colors", List.of("#4285f4"));
chart.setOptions(options);

// After — theme is the base, chart-specific puts override
Map<String, Object> options = loadTheme();
options.put("chartArea", Map.of(...));
options.put("colors", List.of("#4285f4"));
chart.setOptions(options);
```

Only change `new HashMap<>()` to the theme loader. Don't touch chart types,
data, series config, or any existing `put()` calls.

## Supported Chart Types

webforJ `GoogleChart.Type` enum:

| Type | Google Docs |
|------|-------------|
| `AREA` | [Area Chart](https://developers.google.com/chart/interactive/docs/gallery/areachart#configuration-options) |
| `BAR` | [Bar Chart](https://developers.google.com/chart/interactive/docs/gallery/barchart#configuration-options) |
| `BUBBLE` | [Bubble Chart](https://developers.google.com/chart/interactive/docs/gallery/bubblechart#configuration-options) |
| `CALENDAR` | [Calendar Chart](https://developers.google.com/chart/interactive/docs/gallery/calendar#configuration-options) |
| `CANDLESTICK` | [Candlestick Chart](https://developers.google.com/chart/interactive/docs/gallery/candlestickchart#configuration-options) |
| `COLUMN` | [Column Chart](https://developers.google.com/chart/interactive/docs/gallery/columnchart#configuration-options) |
| `COMBO` | [Combo Chart](https://developers.google.com/chart/interactive/docs/gallery/combochart#configuration-options) |
| `GANTT` | [Gantt Chart](https://developers.google.com/chart/interactive/docs/gallery/ganttchart#configuration-options) |
| `GAUGE` | [Gauge Chart](https://developers.google.com/chart/interactive/docs/gallery/gauge#configuration-options) |
| `GEO` | [Geo Chart](https://developers.google.com/chart/interactive/docs/gallery/geochart#configuration-options) |
| `HISTOGRAM` | [Histogram](https://developers.google.com/chart/interactive/docs/gallery/histogram#configuration-options) |
| `LINE` | [Line Chart](https://developers.google.com/chart/interactive/docs/gallery/linechart#configuration-options) |
| `ORG` | [Org Chart](https://developers.google.com/chart/interactive/docs/gallery/orgchart#configuration-options) |
| `PIE` | [Pie Chart](https://developers.google.com/chart/interactive/docs/gallery/piechart#configuration-options) |
| `SANKEY` | [Sankey Diagram](https://developers.google.com/chart/interactive/docs/gallery/sankey#configuration-options) |
| `SCATTER` | [Scatter Chart](https://developers.google.com/chart/interactive/docs/gallery/scatterchart#configuration-options) |
| `STEPPED_AREA` | [Stepped Area Chart](https://developers.google.com/chart/interactive/docs/gallery/steppedareachart#configuration-options) |
| `TABLE` | [Table Chart](https://developers.google.com/chart/interactive/docs/gallery/table#configuration-options) |
| `TIMELINE` | [Timeline](https://developers.google.com/chart/interactive/docs/gallery/timeline#configuration-options) |
| `TREEMAP` | [Tree Map](https://developers.google.com/chart/interactive/docs/gallery/treemap#configuration-options) |
| `WORDTREE` | [Word Tree](https://developers.google.com/chart/interactive/docs/gallery/wordtree#configuration-options) |

Each chart type has its own configuration options. Refer to the linked Google
Charts documentation for the complete list per type. Options that a chart type
does not support are silently ignored.

## Built-in Theme

Google Charts has one built-in theme: `"maximized"`. It sets:
- `chartArea: { width: '100%', height: '100%' }`
- `legend: { position: 'in' }`
- `titlePosition: 'in'`
- `axisTitlesPosition: 'in'`
- `hAxis: { textPosition: 'in' }`
- `vAxis: { textPosition: 'in' }`

Use via `options.put("theme", "maximized")`. Individual options override it.
