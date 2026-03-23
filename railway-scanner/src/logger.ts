/**
 * Structured logger for the scanner.
 * Writes JSON to stdout/stderr for Railway log aggregation.
 */

function ts(): string {
  return new Date().toISOString();
}

function fmt(
  level: string,
  component: string,
  message: string,
  meta?: Record<string, unknown>
): string {
  const obj: Record<string, unknown> = {
    ts: ts(),
    level,
    component,
    message,
  };
  if (meta) {
    obj.meta = meta;
  }
  return JSON.stringify(obj);
}

export const logger = {
  info(component: string, message: string, meta?: Record<string, unknown>) {
    console.log(fmt('info', component, message, meta));
  },
  warn(component: string, message: string, meta?: Record<string, unknown>) {
    console.warn(fmt('warn', component, message, meta));
  },
  error(component: string, message: string, meta?: Record<string, unknown>) {
    console.error(fmt('error', component, message, meta));
  },
};
