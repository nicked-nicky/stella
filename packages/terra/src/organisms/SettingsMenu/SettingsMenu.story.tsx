import { SettingsMenu } from './SettingsMenu';
import type { SettingsSchema } from './types';

/**
 * Mount target for `SettingsMenu.ct.tsx`.
 *
 * It lives in its own module rather than inside the test file because
 * Playwright CT compiles the test file for Node and the component tree
 * for the browser separately — a component *defined* in a `.ct.tsx` file
 * can't cross that boundary, and `mount()` fails with "cannot be mounted,
 * create a test story instead". Components imported from elsewhere are
 * fine, which is why the Button and WindowChrome tests mount directly.
 *
 * Not matched by `testMatch: '**\/*.ct.tsx'`, so it is not collected as
 * a test file itself.
 */

const schema: SettingsSchema = {
  categories: [
    {
      id: 'general',
      label: 'General',
      fields: [
        { key: 'name', type: 'text', label: 'Display name' },
        { key: 'autosave', type: 'boolean', label: 'Auto-save' },
      ],
    },
    {
      id: 'appearance',
      label: 'Appearance',
      fields: [
        {
          key: 'theme',
          type: 'choice',
          label: 'Theme',
          options: [
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ],
        },
      ],
    },
  ],
};

const values = {
  general: { name: 'Nick', autosave: true },
  appearance: { theme: 'dark' },
};

export function SettingsMenuFixture() {
  return (
    <div style={{ height: 400 }}>
      <SettingsMenu schema={schema} values={values} onChange={() => {}} />
    </div>
  );
}
