import Document, { Html, Head, Main, NextScript } from 'next/document'

const setInitialTheme = `
(function () {
  try {
    var mode = localStorage.getItem('valora_color_mode');
    if (!mode) {
      mode = localStorage.getItem('color-mode');
      if (mode) {
        localStorage.setItem('valora_color_mode', mode);
      }
    }
    if (mode !== 'dark' && mode !== 'light') {
      mode = 'light';
    }
    var root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('theme-dark');
      root.classList.remove('theme-light');
    } else {
      root.classList.add('theme-light');
      root.classList.remove('theme-dark');
    }
    root.style.colorScheme = mode;
  } catch (e) {}
})();
`;

export default class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <script
            dangerouslySetInnerHTML={{ __html: setInitialTheme }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
