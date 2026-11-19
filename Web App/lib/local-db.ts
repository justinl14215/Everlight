import { randomUUID } from 'node:crypto';
import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

type Row = Record<string, any>;
type Table = 'everlight_campaigns' | 'everlight_players' | 'everlight_events';
const filename = resolve('.everlight-local.json');
const defaults: Record<Table, Row> = {
  everlight_campaigns: {
    title: 'The Five Days of Everlight', chapter: 1, scene: 'The Invitation',
    announcement: 'The kingdom awaits its heroes.',
    combat: { active: false, enemy: '', hp: 0, maxHp: 0, turn: 0 },
  },
  everlight_players: { hp: 16, max_hp: 16, gold: 0, inventory: [] },
  everlight_events: { body: '', visible_to: 'all' },
};

export function localDb() {
  return {
    from(table: Table) {
      const filters: [string, unknown][] = [];
      let ordering: { key: string; ascending: boolean } | undefined;
      let limit = Infinity;
      let mutation: { kind: 'insert' | 'update' | 'upsert'; values: Row } | undefined;

      // Execute synchronously so reads and writes cannot interleave in the local server.
      function execute() {
        let store: Record<Table, Row[]>;
        try {
          store = JSON.parse(readFileSync(filename, 'utf8'));
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
          store = { everlight_campaigns: [], everlight_players: [], everlight_events: [] };
        }
        const rows = store[table];
        let data = rows.filter(row => filters.every(([key, value]) => row[key] === value));

        if (mutation) {
          const { kind, values } = mutation;
          if (kind === 'update') {
            data.forEach(row => Object.assign(row, values));
          } else {
            const existing = kind === 'upsert' && rows.find(row =>
              row.campaign_id === values.campaign_id && row.slot === values.slot);
            if (existing) {
              Object.assign(existing, values);
              data = [existing];
            } else {
              if (table === 'everlight_campaigns' && rows.some(row => row.code === values.code)) {
                return { data: null, error: new Error('Campaign already exists') };
              }
              const id = table === 'everlight_events' ? (rows.at(-1)?.id ?? 0) + 1 : randomUUID();
              const row = { ...defaults[table], ...values, id, created_at: new Date().toISOString() };
              rows.push(row);
              data = [row];
            }
          }
          const temporary = filename + '.tmp';
          writeFileSync(temporary, JSON.stringify(store));
          renameSync(temporary, filename);
        }
        if (ordering) {
          const { key, ascending } = ordering;
          data.sort((a, b) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0) * (ascending ? 1 : -1));
        }
        return { data: data.slice(0, limit), error: null };
      }

      const query = {
        select(_columns?: string) { return query; },
        eq(key: string, value: unknown) { filters.push([key, value]); return query; },
        order(key: string, options?: { ascending?: boolean }) {
          ordering = { key, ascending: options?.ascending ?? true };
          return query;
        },
        limit(count: number) { limit = count; return query; },
        update(values: Row) { mutation = { kind: 'update', values }; return query; },
        insert(values: Row) { mutation = { kind: 'insert', values }; return query; },
        upsert(values: Row, _options: { onConflict: string }) {
          mutation = { kind: 'upsert', values };
          return query;
        },
        async single() {
          const { data, error } = execute();
          return { data: data?.[0] ?? null, error: error ?? (data?.length === 1 ? null : new Error('Expected one row')) };
        },
        async maybeSingle() {
          const { data, error } = execute();
          return { data: data?.[0] ?? null, error };
        },
        then<T>(resolve: (value: ReturnType<typeof execute>) => T) {
          return Promise.resolve().then(execute).then(resolve);
        },
      };
      return query;
    },
  };
}
