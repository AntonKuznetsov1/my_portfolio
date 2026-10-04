import nextVitals from 'eslint-config-next/core-web-vitals'
import prettier from 'eslint-config-prettier'

export default [
  ...nextVitals,
  prettier,
  {
    rules: {
      'react/prop-types': 'off',
      'react/display-name': 'off',
      '@next/next/no-img-element': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'no-unused-vars': 'warn'
    }
  }
]
