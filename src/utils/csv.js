"use strict";

/**
 * Minimal CSV serializer. Produces a header row + one row per object.
 * Values containing commas, quotes or newlines are quoted/escaped per RFC 4180.
 * null/undefined render as an empty cell.
 */

function escapeCell(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * @param {Array<Object>} rows
 * @param {Array<string>} [columns] explicit column order; inferred from the
 *   first row when omitted.
 * @returns {string} CSV text
 */
function toCsv(rows, columns) {
  const data = Array.isArray(rows) ? rows : [];
  const cols =
    columns && columns.length
      ? columns
      : data.length
      ? Object.keys(data[0])
      : [];

  const headerLine = cols.map(escapeCell).join(",");
  const bodyLines = data.map((row) =>
    cols.map((col) => escapeCell(row ? row[col] : "")).join(",")
  );

  return [headerLine, ...bodyLines].join("\n");
}

module.exports = { toCsv };
