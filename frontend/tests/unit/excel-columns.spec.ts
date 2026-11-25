import { expect, test } from "@playwright/test";
import * as XLSX from "xlsx";
import {
  applyColumnSelection, fileWithColumns, getSheetHeaders, inspectImportFile, keepSheetColumns, matchImportColumn,
  readFromExcel,
} from "../../src/utils/excel";
import { BULLETINS_TEMPLATE, OPERATORS_TEMPLATE } from "../../src/utils/importTemplates";

const sheet = () =>
  XLSX.utils.json_to_sheet([
    { Code: "A", Name: "Alpha", Age: 30 },
    { Code: "B", Name: "Beta", Age: 41 },
  ]);

test("export keeps only the chosen columns, in their original order, with values and types", () => {
  const ws = keepSheetColumns(sheet(), ["Age", "Code"]);
  expect(getSheetHeaders(ws)).toEqual(["Code", "Age"]);
  expect(XLSX.utils.sheet_to_json(ws)).toEqual([{ Code: "A", Age: 30 }, { Code: "B", Age: 41 }]);
});

test("a sheet with no columns chosen is left out; sheets not in the selection are kept whole", () => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet(), "One");
  XLSX.utils.book_append_sheet(wb, sheet(), "Two");
  XLSX.utils.book_append_sheet(wb, sheet(), "Three");
  const out = applyColumnSelection(wb, { One: ["Name"], Two: [] });
  expect(out.SheetNames).toEqual(["One", "Three"]);
  expect(getSheetHeaders(out.Sheets.One)).toEqual(["Name"]);
  expect(getSheetHeaders(out.Sheets.Three)).toEqual(["Code", "Name", "Age"]);
});

test("import drops unticked columns so the page reads them as absent", async () => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet(), "Data");
  const bytes = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  const parsed = await inspectImportFile(new File([bytes], "ops.xlsx"));
  expect(parsed.headers).toEqual(["Code", "Name", "Age"]);
  expect(parsed.rowCount).toBe(2);

  const filtered = fileWithColumns(parsed, ["Code", "Name"], "ops.xlsx");
  expect(await readFromExcel(filtered)).toEqual([{ Code: "A", Name: "Alpha" }, { Code: "B", Name: "Beta" }]);
});

test("template columns match file headers by name or alias, ignoring case", () => {
  expect(matchImportColumn(OPERATORS_TEMPLATE, " employee id ")?.required).toBe(true);
  expect(matchImportColumn(BULLETINS_TEMPLATE, "OB Code")?.header).toBe("Bulletin Code");
  expect(matchImportColumn(OPERATORS_TEMPLATE, "Shoe Size")).toBeUndefined();
});
