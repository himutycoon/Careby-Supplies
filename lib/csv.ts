/**
 * Minimal RFC 4180 CSV reader.
 *
 * Written rather than installed: the only CSV this app reads is a
 * product sheet an admin exported from Excel or Sheets, and a parser
 * dependency is a poor trade for ~60 lines. What it does handle is the
 * part a `split(",")` gets wrong — quoted fields containing commas,
 * newlines and doubled quotes — which is exactly what a product
 * description tends to contain.
 *
 * Not handled, deliberately: alternative delimiters and multi-sheet
 * workbooks. `.xlsx` is a zip of XML and cannot be read without a real
 * library; the importer asks for "Save as CSV" instead.
 */
export function parseCsv(text: string): string[][] {
  // Strip a BOM — Excel writes one on "CSV UTF-8" and it would
  // otherwise become part of the first header name.
  const input = text.replace(/^﻿/, "");

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

    if (inQuotes) {
      if (char === '"') {
        // "" inside a quoted field is one literal quote.
        if (input[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\r") {
      // Swallow; the \n that follows ends the row.
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  // Last line without a trailing newline.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Drop rows that are entirely empty — a trailing newline, or the blank
  // lines spreadsheets like to leave at the bottom of an export.
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

/** Quotes a value for CSV output, for the downloadable template. */
export function toCsvValue(value: string | number | boolean): string {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: (string | number | boolean)[][]): string {
  return rows.map((row) => row.map(toCsvValue).join(",")).join("\r\n");
}
