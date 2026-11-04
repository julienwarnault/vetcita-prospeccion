import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import App from "../src/client/App";
import ClinicDetails from "../src/client/pages/ClinicDetails";
import AddClinicPage from "../src/client/pages/AddClinicPage";
import DirectoryPage from "../src/client/pages/DirectoryPage";
import SummaryPage from "../src/client/pages/SummaryPage";
import { blankClinic, blankVisit, clinicSchema } from "../src/shared/schemas";
import ClinicMap from "../src/client/components/ClinicMap";
import {
  mapClinics,
  tileUrl,
  mapStyle,
  clinicPoints,
  positionPoint,
} from "../src/client/map";

const clinic = clinicSchema.parse(
  JSON.parse(readFileSync("public/clinics.json", "utf8"))[0],
);
const noop = () => {};

test("home retains its desktop and mobile navigation and actions", () => {
  const html = renderToStaticMarkup(<App />);
  for (const text of [
    "Hoy es un buen día",
    "Cerca de mí",
    "Todas las clínicas",
    "Historial",
    "Resumen",
    "Agregar clínica",
    'aria-label="Navegación móvil"',
  ])
    assert.ok(html.includes(text), text);
});

test("clinic detail retains all visit fields and disables editing during save", () => {
  const html = renderToStaticMarkup(
    <ClinicDetails
      selected={clinic}
      draft={blankVisit}
      setDraft={noop}
      onBack={noop}
      save={noop}
      msg=""
      saving={true}
      canSave={true}
    />,
  );
  for (const text of [
    "Persona de contacto",
    "Herramientas actuales",
    "Sobre la clínica",
    "Notas",
    "Correo electrónico",
    "Guardando",
    'disabled=""',
  ])
    assert.ok(html.includes(text), text);
  assert.ok(html.includes(clinic.name));
});

test("manual clinic form keeps required inputs and optional GPS", () => {
  const html = renderToStaticMarkup(
    <AddClinicPage
      go={noop}
      newClinic={blankClinic}
      setNewClinic={noop}
      boroughs={[]}
      locating={false}
      clinicLocation={noop}
      adding={false}
      addClinic={noop}
      addMsg=""
    />,
  );
  assert.equal((html.match(/required=""/g) || []).length, 2);
  assert.ok(html.includes("Usar GPS"));
  assert.ok(html.includes("Guardar clínica"));
});

test("directory, nearby, history and summary pages still render", () => {
  const props = {
    pos: null,
    geo: "",
    locate: noop,
    go: noop,
    query: "",
    setQuery: noop,
    borough: "",
    setBorough: noop,
    boroughs: [],
    status: "",
    setStatus: noop,
    hasLegacy: false,
    filtered: [clinic],
    map: false,
    setMap: noop,
    card: () => <span key="clinic">{clinic.name}</span>,
    open: noop,
  };
  for (const [page, title] of [
    ["list", "Todas las clínicas"],
    ["near", "Cerca de mí"],
    ["history", "Historial de visitas"],
  ] as const) {
    const html = renderToStaticMarkup(<DirectoryPage {...props} page={page} />);
    assert.ok(html.includes(title));
    assert.ok(html.includes(clinic.name));
  }
  const html = renderToStaticMarkup(
    <SummaryPage
      clinics={[clinic]}
      visits={{}}
      visited={0}
      go={noop}
      card={props.card}
    />,
  );
  assert.ok(html.includes("Resumen de actividad"));
});

test("map renders directly in the page so tile requests can identify the site", () => {
  const html = renderToStaticMarkup(
    <ClinicMap
      clinics={[clinic]}
      nearby={false}
      position={null}
      onOpen={noop}
    />,
  );
  assert.ok(html.includes('class="clinic-map '));
  assert.ok(!html.includes("iframe"));
  assert.ok(!html.includes("srcDoc"));
  assert.equal(tileUrl, "https://tile.openstreetmap.org/{z}/{x}/{y}.png");
  const source = mapStyle().sources.basemap;
  assert.equal(source.type, "raster");
});

test("map preserves zero coordinates, excludes missing ones and limits nearby markers", () => {
  const points = mapClinics(
    [
      { ...clinic, lat: 0, lng: 0 },
      { ...clinic, id: "missing", lat: null },
    ],
    false,
  );
  assert.equal(points.length, 1);
  assert.equal(points[0].lat, 0);
  const many = Array.from({ length: 120 }, (_, i) => ({
    ...clinic,
    id: String(i),
  }));
  assert.equal(mapClinics(many, true).length, 100);
  assert.equal(mapClinics(many, false).length, 120);
});

test("Radix choices expose their label, radio semantics and selected value", async () => {
  const { default: Choices } = await import("../src/client/components/Choices");
  const html = renderToStaticMarkup(
    <Choices
      label="¿Ya utiliza una plataforma?"
      value="Sí"
      options={["Sí", "No", "No sabe"] as const}
      onChange={noop}
    />,
  );
  assert.ok(html.includes('role="radiogroup"'));
  assert.ok(html.includes("aria-labelledby="));
  assert.equal((html.match(/role="radio"/g) || []).length, 3);
  assert.equal((html.match(/aria-checked="true"/g) || []).length, 1);
});

test("Radix list/map control keeps its selected mode", () => {
  const html = renderToStaticMarkup(
    <DirectoryPage
      page="list"
      pos={null}
      geo=""
      locate={noop}
      go={noop}
      query=""
      setQuery={noop}
      borough=""
      setBorough={noop}
      boroughs={[]}
      status=""
      setStatus={noop}
      hasLegacy={false}
      filtered={[]}
      map={true}
      setMap={noop}
      card={() => null}
      open={noop}
    />,
  );
  assert.ok(html.includes('aria-label="Vista del directorio"'));
  assert.ok(html.includes('aria-label="Mapa"'));
  assert.equal((html.match(/aria-checked="true"/g) || []).length, 1);
});

test("MapLibre uses a single unclustered GeoJSON layer and longitude-latitude coordinates", () => {
  const points = mapClinics([{ ...clinic, lat: 21.1, lng: -101.6 }], false);
  const data = clinicPoints(points);
  assert.deepEqual(data.features[0].geometry.coordinates, [-101.6, 21.1]);
  assert.equal(data.features[0].properties.clinicId, clinic.id);
  const source = mapStyle().sources.clinics;
  assert.equal(source.type, "geojson");
  if (source.type === "geojson") assert.equal(source.cluster, false);
  const markerLayer = mapStyle().layers.find((layer) => layer.id === "clinics");
  assert.equal(markerLayer?.type, "symbol");
  if (markerLayer?.type === "symbol") {
    assert.equal(markerLayer.layout?.["icon-image"], "clinic-marker");
    assert.equal(markerLayer.layout?.["icon-allow-overlap"], true);
  }
  assert.equal(
    mapStyle().layers.filter(
      (layer) => "source" in layer && layer.source === "clinics",
    ).length,
    1,
  );
  assert.equal(positionPoint(null).features.length, 0);
  assert.deepEqual(
    positionPoint([19.4, -99.1]).features[0].geometry.coordinates,
    [-99.1, 19.4],
  );
});

test("lazy MapLibre import exposes the runtime constructors used by the map", async () => {
  const { default: engine } = await import("maplibre-gl");
  assert.equal(typeof engine.Map, "function");
  assert.equal(typeof engine.Popup, "function");
  assert.equal(typeof engine.NavigationControl, "function");
});
