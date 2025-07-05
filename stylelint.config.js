/** @type {import('stylelint').Config} */
export default {
  root: true,
  extends: ['stylelint-config-standard-scss'],
  rules: {
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['global', 'export'],
      },
    ],
    'import-notation': 'url',
  },
};
